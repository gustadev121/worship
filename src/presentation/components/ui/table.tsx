import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from "react";

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  containerClassName?: string;
}

export function Table({
  children,
  className = "",
  containerClassName = "",
  ...props
}: TableProps) {
  return (
    <div className={`wf-table-container ${containerClassName}`}>
      <table className={`wf-table ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export interface TableHeaderProps
  extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableHeader({
  className = "",
  children,
  ...props
}: TableHeaderProps) {
  return (
    <thead className={`wf-thead ${className}`} {...props}>
      {children}
    </thead>
  );
}

export interface TableBodyProps
  extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableBody({
  className = "",
  children,
  ...props
}: TableBodyProps) {
  return (
    <tbody className={`wf-tbody ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export interface TableFooterProps
  extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableFooter({
  className = "",
  children,
  ...props
}: TableFooterProps) {
  return (
    <tfoot className={`wf-tfoot ${className}`} {...props}>
      {children}
    </tfoot>
  );
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  isClickable?: boolean;
}

export function TableRow({
  className = "",
  isClickable = false,
  children,
  ...props
}: TableRowProps) {
  const classes = ["wf-tr", isClickable && "wf-tr-clickable", className]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className={classes} {...props}>
      {children}
    </tr>
  );
}

export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
}

export function TableHead({
  className = "",
  children,
  ...props
}: TableHeadProps) {
  return (
    <th className={`wf-th ${className}`} scope="col" {...props}>
      {children}
    </th>
  );
}

export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export function TableCell({
  className = "",
  children,
  ...props
}: TableCellProps) {
  return (
    <td className={`wf-td ${className}`} {...props}>
      {children}
    </td>
  );
}

export interface TableCaptionProps
  extends HTMLAttributes<HTMLTableCaptionElement> {
  children: ReactNode;
}

export function TableCaption({
  className = "",
  children,
  ...props
}: TableCaptionProps) {
  return (
    <caption className={`wf-table-caption ${className}`} {...props}>
      {children}
    </caption>
  );
}
