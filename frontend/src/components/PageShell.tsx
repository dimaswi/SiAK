import * as React from "react"

interface PageShellProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  backButton?: React.ReactNode
  footer?: React.ReactNode
}

export default function PageShell({ title, description, actions, children, backButton, footer }: PageShellProps) {
  return (
    <div className="flex flex-col flex-1 relative min-w-0">
      <div className="flex flex-col flex-1 p-4 lg:p-4">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-4">
              {backButton && (
                <div className="shrink-0">
                  {backButton}
                </div>
              )}
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold tracking-normal text-foreground leading-normal">
                  {title}
                </h1>
                {description && (
                  <p className="text-xs text-muted-foreground tracking-normal leading-normal">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 p-2 flex-1">
            {children}
          </div>
        </div>
      </div>

      {footer && (
        <div className="sticky bottom-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t p-2 flex items-center justify-end gap-4 shadow-sm px-6 lg:px-8 mt-auto">
          {footer}
        </div>
      )}
    </div>
  )
}
