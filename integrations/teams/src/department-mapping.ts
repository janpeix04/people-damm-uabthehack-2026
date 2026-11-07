import type { EmployeeDepartment, EmployeeLanguage } from "./types.js";

const normalise = (value: string | null | undefined): string =>
  value?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() ?? "";

export function mapDepartment(
  department: string | null | undefined,
  jobTitle: string | null | undefined,
  officeLocation: string | null | undefined,
): EmployeeDepartment {
  const text = normalise(`${department ?? ""} ${jobTitle ?? ""} ${officeLocation ?? ""}`);

  if (/(factory|fabrica|produccio|produccion|envas|packaging|brew|manteniment)/.test(text)) {
    return "factories";
  }
  if (/(logistic|magatzem|almacen|warehouse|distribu|supply|transport)/.test(text)) {
    return "logistics";
  }
  if (/(comercial|sales|venta|trade|hosteleria|horeca|client)/.test(text)) {
    return "commercial";
  }
  return "offices";
}

export function mapLanguage(language: string | null | undefined): EmployeeLanguage {
  const value = normalise(language).replace("_", "-");
  if (value.startsWith("ca")) return "ca";
  if (value.startsWith("en")) return "en";
  return "es";
}
