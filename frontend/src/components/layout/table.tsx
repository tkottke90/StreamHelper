import { BaseProps } from "../../utils/component.utils";

export function Table({ headers, children, className }: BaseProps<{ headers: string[] }>) {

  return (
    <table className={className}>
      <thead>
        <tr>
          {headers.map((header, index) => (<th className="capitalize" key={`tableHeader-${header}-${index}`} >{header}</th>))}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
  )
}

export function TableCell({ className, children, key }: BaseProps) {

  return (
    <td key={key} className={`py-4 px-2 ${className}`}>
      { children }
    </td>
  );
}