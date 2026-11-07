import type {
  DirectoryPage,
  EmployeeDirectoryProvider,
  EmployeeDirectoryRecord,
} from "./types.js";

const SYNTHETIC_EMPLOYEES: EmployeeDirectoryRecord[] = [
  ["demo-fab-001", "Marta Soler", "marta.soler@example.invalid", "factories", "Produccio", "Operadora d'envasat", "El Prat", "ca", "Employee", "2018-04-09"],
  ["demo-fab-002", "David Romero", "david.romero@example.invalid", "factories", "Mantenimiento", "Tecnico de mantenimiento", "El Prat", "es", "Employee", "2022-10-17"],
  ["demo-fab-003", "Aina Vidal", "aina.vidal@example.invalid", "factories", "Produccio", "Cap de torn", "El Prat", "ca", "Employee", "2015-02-02"],
  ["demo-log-001", "Jordi Rius", "jordi.rius@example.invalid", "logistics", "Logistica", "Mosso de magatzem", "ZAL Barcelona", "ca", "Employee", "2020-06-22"],
  ["demo-log-002", "Nuria Ortega", "nuria.ortega@example.invalid", "logistics", "Distribucion", "Coordinadora de rutas", "ZAL Barcelona", "es", "Employee", "2019-09-16"],
  ["demo-log-003", "Owen Clarke", "owen.clarke@example.invalid", "logistics", "Supply Chain", "Demand planner", "Barcelona", "en", "Employee", "2024-01-08"],
  ["demo-com-001", "Laia Ferrer", "laia.ferrer@example.invalid", "commercial", "Comercial", "Gestora HORECA", "Barcelona", "ca", "Employee", "2021-03-01"],
  ["demo-com-002", "Carlos Iglesias", "carlos.iglesias@example.invalid", "commercial", "Ventas", "Delegado comercial", "Madrid", "es", "Employee", "2017-11-13"],
  ["demo-com-003", "Emily Brown", "emily.brown@example.invalid", "commercial", "International Sales", "Key account manager", "London", "en", "Employee", "2023-05-15"],
  ["demo-off-001", "Mireia Puig", "mireia.puig@example.invalid", "offices", "Persones", "People partner", "Antiga Fabrica", "ca", "Employee", "2016-07-04"],
  ["demo-off-002", "Alejandro Martin", "alejandro.martin@example.invalid", "offices", "Finanzas", "Controller", "Antiga Fabrica", "es", "Employee", "2020-02-10"],
  ["demo-off-003", "Hannah Wilson", "hannah.wilson@example.invalid", "offices", "Digital", "Product manager", "Barcelona", "en", "Contractor", "2025-01-20"]
].map((row) => ({
  externalId: row[0],
  displayName: row[1],
  email: row[2],
  department: row[3],
  departmentSource: row[4],
  jobTitle: row[5],
  officeLocation: row[6],
  preferredLanguage: row[7],
  employeeType: row[8],
  employeeHireDate: row[9],
  accountEnabled: true,
  source: "demo",
})) as EmployeeDirectoryRecord[];

export class DemoDirectoryProvider implements EmployeeDirectoryProvider {
  readonly source = "demo" as const;

  constructor(private readonly employees = SYNTHETIC_EMPLOYEES) {}

  async listEmployees(input: { cursor?: string; pageSize?: number } = {}): Promise<DirectoryPage> {
    const start = Number.parseInt(input.cursor ?? "0", 10);
    const pageSize = Math.min(Math.max(input.pageSize ?? 100, 1), 999);
    const end = Math.min(start + pageSize, this.employees.length);

    return {
      employees: this.employees.slice(start, end),
      nextCursor: end < this.employees.length ? String(end) : null,
      deltaCursor: "demo-static-v1",
    };
  }

  async syncChanges(): Promise<DirectoryPage> {
    return { employees: [], nextCursor: null, deltaCursor: "demo-static-v1" };
  }
}

export { SYNTHETIC_EMPLOYEES };
