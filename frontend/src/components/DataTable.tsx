import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  emptyMessage?: string
  emptySubMessage?: string

  // Pagination
  pageCount: number
  pageIndex: number
  onPageChange: (page: number) => void

  // Search (Optional)
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  totalItems?: number
  extraFilters?: React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  emptyMessage = "Data tidak ditemukan",
  emptySubMessage,
  pageCount,
  pageIndex,
  onPageChange,
  searchPlaceholder = "Cari...",
  searchValue,
  onSearchChange,
  totalItems,
  extraFilters,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  })

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      {(onSearchChange !== undefined || totalItems !== undefined || extraFilters) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            {onSearchChange && (
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  className="pl-9"
                  value={searchValue || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            )}
            {extraFilters}
          </div>
          {totalItems !== undefined && (
            <p className="text-sm text-muted-foreground ml-auto hidden sm:block">
              {totalItems} total data
            </p>
          )}
        </div>
      )}

      <div className="border rounded-none bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-10 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="p-4">
                      <div className="h-4 bg-muted/50 rounded-none animate-pulse w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="transition-colors hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <p className="text-sm font-medium">{emptyMessage}</p>
                    {emptySubMessage && <p className="text-xs mt-1">{emptySubMessage}</p>}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modern Professional Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-1">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Hal <span className="text-foreground">{pageIndex}</span> / {pageCount}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-none border-dashed hover:border-solid hover:bg-muted"
              onClick={() => onPageChange(1)}
              disabled={pageIndex === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-none border-dashed hover:border-solid hover:bg-muted"
              onClick={() => onPageChange(pageIndex - 1)}
              disabled={pageIndex === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-none border-dashed hover:border-solid hover:bg-muted"
              onClick={() => onPageChange(pageIndex + 1)}
              disabled={pageIndex === pageCount}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-none border-dashed hover:border-solid hover:bg-muted"
              onClick={() => onPageChange(pageCount)}
              disabled={pageIndex === pageCount}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
