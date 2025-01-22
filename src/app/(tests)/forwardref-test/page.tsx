"use client"

import { AnimateChildren } from "@/app/lib/AnimateChildren"
import { forwardRef, useState, type ComponentProps, type ComponentPropsWithoutRef } from "react"

export default function Page() {

  const [arr, setArr] = useState([1, 2, 3, 4, 5])
  const shuffle = () => setArr(arr.toSorted(() => Math.random() - 0.5))

  return (
    <div className="p-4">
      <h1>ForwardRef Test</h1>
      <button onClick={shuffle}>Shuffle</button>
      <AnimateChildren>
        {arr.map((n, i) =>
          <Div className="w-10 h-10 p-2 bg-red-800" key={n}>{n}</Div>)}
      </AnimateChildren>
    </div>
  )
}

const Div = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<"div">
>(
  function DivWithForwardRef({ ...props }, ref) {
    return (
      <div ref={ref} {...props} />
    )
  }
)