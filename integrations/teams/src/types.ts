export type EmployeeLanguage = "ca" | "es" | "en";

export type EmployeeDepartment =
  | "factories"
  | "logistics"
  | "commercial"
  | "offices";

export interface EmployeeDirectoryRecord {
  /** Stable internal/external identity. Never expose this in survey analytics. */
  externalId: string;
  displayName: string;
  email: string | null;
  department: EmployeeDepartment;
  departmentSource: string | null;
  jobTitle: string | null;
  officeLocation: string | null;
  preferredLanguage: EmployeeLanguage;
  employeeType: string | null;
  employeeHireDate: string | null;
  accountEnabled: boolean;
  source: "demo" | "microsoft_graph";
}

export interface DirectoryPage {
  employees: EmployeeDirectoryRecord[];
  nextCursor: string | null;
  deltaCursor: string | null;
}

export interface EmployeeDirectoryProvider {
  readonly source: EmployeeDirectoryRecord["source"];
  listEmployees(input?: {
    cursor?: string;
    pageSize?: number;
  }): Promise<DirectoryPage>;
  syncChanges?(deltaCursor?: string): Promise<DirectoryPage>;
}

export type GraphTokenProvider = () => Promise<string>;
