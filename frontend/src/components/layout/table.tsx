import { Signal } from "@preact/signals";
import { DefaultProps } from "../../utils/component.utils";


interface TableProps extends DefaultProps {
  headers: string[]
}

export function Table({ headers, children, className }: TableProps) {

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

export function TableCell({ className, children, key }: DefaultProps) {

  return (
    <td key={key} className={`py-4 px-2 ${className}`}>
      { children }
    </td>
  );
}