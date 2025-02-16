export function compoundClass(
  baseStyle: string,
  conditionalStyle: Record<string, boolean>
) {
  let conditionStr = '';

  Object.keys(conditionalStyle).forEach((key) => {
    if (conditionalStyle[key]) {
      conditionStr += key;
    }
  });

  return `${baseStyle} ${conditionStr}`;
}
