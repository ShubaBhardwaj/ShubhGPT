"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { CheckIcon, CopyIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function CodeBlock({
  language,
  value,
}: {
  language: string
  value: string
}) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-border/80 bg-zinc-950 font-mono text-sm text-zinc-50 shadow-md dark:border-zinc-800">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs text-zinc-400">
        <span className="font-semibold uppercase tracking-wider text-zinc-300">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
          title="Copy code"
        >
          {copied ? (
            <>
              <CheckIcon className="size-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code contents */}
      <div className="overflow-x-auto p-4 leading-relaxed">
        <pre className="m-0 font-mono text-sm leading-relaxed text-zinc-100">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  )
}

export function MarkdownRenderer({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div className={cn("prose prose-neutral dark:prose-invert max-w-none text-sm leading-normal break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            const codeString = String(children).replace(/\n$/, "")
            const isInline = !match && !codeString.includes("\n")

            if (isInline) {
              return (
                <code
                  className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <CodeBlock
                language={match ? match[1] : ""}
                value={codeString}
              />
            )
          },
          p({ children }) {
            return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
          },
          ul({ children }) {
            return <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>
          },
          ol({ children }) {
            return <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-l-4 border-primary/50 pl-4 italic text-muted-foreground">
                {children}
              </blockquote>
            )
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">{children}</table>
              </div>
            )
          },
          th({ children }) {
            return (
              <th className="bg-muted px-3 py-2 font-semibold text-foreground border-b border-border">
                {children}
              </th>
            )
          },
          td({ children }) {
            return <td className="px-3 py-2 border-b border-border/50">{children}</td>
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
              >
                {children}
              </a>
            )
          },
          h1({ children }) {
            return <h1 className="mt-4 mb-2 text-xl font-bold tracking-tight">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="mt-3 mb-2 text-lg font-bold tracking-tight">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="mt-3 mb-1 text-base font-semibold">{children}</h3>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
