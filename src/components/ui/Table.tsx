/**
 * Data table — compound component pattern.
 *
 * @example
 * ```tsx
 * <Table>
 *   <Table.Head>
 *     <Table.Row>
 *       <Table.HeadCell>Name</Table.HeadCell>
 *       <Table.HeadCell align="right">Price</Table.HeadCell>
 *     </Table.Row>
 *   </Table.Head>
 *   <Table.Body>
 *     <Table.Row onClick={() => {}}>
 *       <Table.Cell>Product A</Table.Cell>
 *       <Table.Cell align="right">₦4,000</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * ```
 */
import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

export interface TableProps {
  children: ReactNode;
  className?: string;
}

function TableRoot({ children, className = "" }: TableProps) {
  return (
    <table
      className={`w-full border-collapse [&_tbody_tr:last-child_td]:border-b-0 ${className}`.trim()}
    >
      {children}
    </table>
  );
}

function TableHead({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <thead className={`bg-[#F5F0E8] ${className}`.trim()}>
      {children}
    </thead>
  );
}

function TableBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tbody
      className={[
        "[&_tr:nth-child(odd)]:bg-white [&_tr:nth-child(even)]:bg-[#FAFAF8]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </tbody>
  );
}

export interface TableRowProps
  extends Omit<HTMLAttributes<HTMLTableRowElement>, "onClick"> {
  onClick?: () => void;
  className?: string;
}

function TableRow({ children, onClick, className = "", ...rest }: TableRowProps) {
  const interactive = onClick
    ? "cursor-pointer hover:bg-[#F0EDE6] transition-colors duration-150 ease-in-out motion-reduce:transition-none"
    : "";

  return (
    <tr
      {...rest}
      onClick={onClick ? () => onClick() : undefined}
      className={`${interactive} ${className}`.trim()}
    >
      {children}
    </tr>
  );
}

export interface TableHeadCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

function TableHeadCell({
  children,
  className = "",
  align = "left",
  ...rest
}: TableHeadCellProps) {
  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <th
      {...rest}
      scope="col"
      className={`border-b border-[#E0DED4] px-3.5 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-[#555555] ${alignClass} ${className}`.trim()}
    >
      {children}
    </th>
  );
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  colSpan?: number;
}

function TableCell({
  children,
  className = "",
  align = "left",
  colSpan,
  ...rest
}: TableCellProps) {
  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <td
      {...rest}
      colSpan={colSpan}
      className={`border-b border-[#EEECE6] px-3.5 py-2.5 font-sans text-[13px] text-[#333333] ${alignClass} ${className}`.trim()}
    >
      {children}
    </td>
  );
}

export const Table = Object.assign(TableRoot, {
  Head: TableHead,
  Body: TableBody,
  Row: TableRow,
  HeadCell: TableHeadCell,
  Cell: TableCell,
});
