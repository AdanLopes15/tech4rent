// Utility: edit nested values immutably by dot-path, incl. array indices
export const setByPath = <T,>(obj: T, path: string, value: any): T => {
  const parts = path.split(".");
  const clone: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) };
  let current = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextIsIndex = /^\d+$/.test(parts[i + 1]);
    const existing = current[key];
    current[key] = existing === undefined || existing === null
      ? (nextIsIndex ? [] : {})
      : Array.isArray(existing) ? [...existing] : { ...existing };
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
  return clone;
};

export const getByPath = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
};
