import { mapDepartment, mapLanguage } from "./department-mapping.js";
import type {
  DirectoryPage,
  EmployeeDirectoryProvider,
  EmployeeDirectoryRecord,
  GraphTokenProvider,
} from "./types.js";

const GRAPH_ROOT = "https://graph.microsoft.com/v1.0";
const USER_FIELDS = [
  "id",
  "displayName",
  "mail",
  "userPrincipalName",
  "department",
  "jobTitle",
  "officeLocation",
  "preferredLanguage",
  "employeeType",
  "employeeHireDate",
  "accountEnabled",
].join(",");

interface GraphUser {
  id: string;
  displayName?: string;
  mail?: string | null;
  userPrincipalName?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  officeLocation?: string | null;
  preferredLanguage?: string | null;
  employeeType?: string | null;
  employeeHireDate?: string | null;
  accountEnabled?: boolean;
  "@removed"?: { reason?: string };
}

interface GraphUserCollection {
  value: GraphUser[];
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
}

export interface MicrosoftGraphDirectoryOptions {
  tokenProvider: GraphTokenProvider;
  fetchImpl?: typeof fetch;
}

/**
 * Server-only Microsoft Graph adapter. Inject a client-credentials or OBO token
 * provider; never forward the Graph token to the browser.
 */
export class MicrosoftGraphDirectoryProvider implements EmployeeDirectoryProvider {
  readonly source = "microsoft_graph" as const;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: MicrosoftGraphDirectoryOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async listEmployees(input: { cursor?: string; pageSize?: number } = {}): Promise<DirectoryPage> {
    const pageSize = Math.min(Math.max(input.pageSize ?? 999, 1), 999);
    const url = input.cursor
      ? this.validateCursor(input.cursor)
      : `${GRAPH_ROOT}/users?$select=${encodeURIComponent(USER_FIELDS)}&$top=${pageSize}`;
    return this.fetchPage(url);
  }

  async syncChanges(deltaCursor?: string): Promise<DirectoryPage> {
    const url = deltaCursor
      ? this.validateCursor(deltaCursor)
      : `${GRAPH_ROOT}/users/delta?$select=${encodeURIComponent(USER_FIELDS)}`;
    return this.fetchPage(url);
  }

  private async fetchPage(url: string): Promise<DirectoryPage> {
    const token = await this.options.tokenProvider();
    const response = await this.fetchImpl(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    if (!response.ok) {
      const retryAfter = response.headers.get("retry-after");
      const body = await response.text();
      throw new Error(
        `Microsoft Graph directory request failed (${response.status})` +
          (retryAfter ? `; retry after ${retryAfter}s` : "") +
          (body ? `: ${body.slice(0, 500)}` : ""),
      );
    }

    const payload = (await response.json()) as GraphUserCollection;
    const employees = payload.value
      .filter((user) => !user["@removed"])
      .map((user) => this.mapUser(user));

    return {
      employees,
      nextCursor: payload["@odata.nextLink"] ?? null,
      deltaCursor: payload["@odata.deltaLink"] ?? null,
    };
  }

  private validateCursor(cursor: string): string {
    const url = new URL(cursor);
    if (url.protocol !== "https:" || url.hostname !== "graph.microsoft.com") {
      throw new Error("Rejected an untrusted Microsoft Graph cursor URL");
    }
    return url.toString();
  }

  private mapUser(user: GraphUser): EmployeeDirectoryRecord {
    return {
      externalId: user.id,
      displayName: user.displayName?.trim() || "Unknown employee",
      email: user.mail ?? user.userPrincipalName ?? null,
      department: mapDepartment(user.department, user.jobTitle, user.officeLocation),
      departmentSource: user.department ?? null,
      jobTitle: user.jobTitle ?? null,
      officeLocation: user.officeLocation ?? null,
      preferredLanguage: mapLanguage(user.preferredLanguage),
      employeeType: user.employeeType ?? null,
      employeeHireDate: user.employeeHireDate ?? null,
      accountEnabled: user.accountEnabled ?? true,
      source: "microsoft_graph",
    };
  }
}

export { USER_FIELDS };
