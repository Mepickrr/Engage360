export function nextSort(current, field) {
  return current.field === field
    ? { field, dir: current.dir === "asc" ? "desc" : "asc" }
    : { field, dir: "desc" };
}

export function sortRows(rows, sort, secondaryField) {
  const { field, dir } = sort;
  const sorted = [...rows].sort((a, b) => {
    const diff = a[field] < b[field] ? -1 : (a[field] > b[field] ? 1 : 0);
    if (diff !== 0) {
      return dir === "desc" ? -diff : diff;
    }
    if (secondaryField) {
      const secDiff = a[secondaryField] < b[secondaryField] ? -1 : (a[secondaryField] > b[secondaryField] ? 1 : 0);
      return dir === "desc" ? -secDiff : secDiff;
    }
    return 0;
  });
  return sorted;
}
