import { useEffect, useRef, useState, type ReactNode } from "react"
import { codeToTokens, type ThemedToken } from "shiki"
import { AnimateChildren } from "../../../lib/AnimateChildren/src"
import * as Diff from "diff"
import * as DiffMatchPatch from "diff-match-patch-es"

export function MagicCode(
  props: {
    code?: string,
  }
) {
  const code = props.code?.trim() ?? ""

  const [tokens, setTokens] = useState<(ThemedToken & { id: string })[]>()

  const prevRef = useRef<(ThemedToken & { id: string })[]>(null)

  const rendered = tokens?.map((token, index) => token.content !== '\n' ? (
    <span key={token.id} style={{ display: "inline-block", color: token.color }}>{token.content}</span>
  ) : <br key={token.id} style={{ display: "inline" }} />) ?? <span className="opacity-0">code</span>

  useEffect(() => {
    (async () => {
      const result = await codeToTokens(code ?? "", {
        lang: "tsx",
        theme: "vesper",
      })

      const tokens = result.tokens
      const flatTokens: (ThemedToken & { id?: string })[] = []
      tokens.forEach((line) => {
        line.forEach((token) => {
          flatTokens.push({ ...token })
        })
        flatTokens.push({ content: '\n', offset: 0 })
      })

      const output = diffAlgo3(prevRef.current ?? [], flatTokens)

      diffAlgo3(prevRef.current ?? [], flatTokens)

      //
      setTokens(output)
      prevRef.current = output
    })()

  }, [code])

  return <AnimateChildren
    useAbsolutePositionOnDeletedElements
  >
    {rendered}
  </AnimateChildren>
}


function diffAlgo3(
  prev: (ThemedToken & { id: string })[],
  next: (ThemedToken & { id?: string, deleted?: boolean, added?: boolean })[],
) {

  const prevMap: (ThemedToken & { id: string })[] = []
  prev.forEach((token, index) => {
    token.content.split('').forEach((char) => prevMap.push(token))
  })

  const nextMap: (ThemedToken & { id?: string, deleted?: boolean, added?: boolean })[] = []
  next.forEach((token, index) => {
    token.content.split('').forEach((char) => nextMap.push(token))
  })

  const testDiff = DiffMatchPatch.diff(
    prev.map(t => t.content).join(''),
    next.map(t => t.content).join(''),
  )
  DiffMatchPatch.diffCleanupSemanticLossless(testDiff)
  console.log(testDiff)

  let prevIndex = 0
  let nextIndex = 0
  testDiff.forEach((part) => {
    const mode = part[0] === -1 ? "-" : part[0] === 1 ? "+" : " "
    const text = part[1]
    text.split('').forEach((char) => {

      if (mode === " ") {
        // nextMap[nextIndex].id = prev[prevIndex].id
        console.log(0, mode, char, prevIndex, nextIndex, prevMap[prevIndex].id, nextMap[nextIndex].id)
        if (nextMap[nextIndex].added === undefined) {
          nextMap[nextIndex].id = prevMap[prevIndex].id
        }
        nextIndex++
        prevIndex++
      }
      if (mode === "-") {
        console.log(0, mode, char, prevIndex, undefined, prevMap[prevIndex].id, undefined)
        // nextMap[nextIndex].deleted = true
        prevIndex++
      }
      if (mode === "+") {
        console.log(0, mode, char, undefined, nextIndex, undefined, nextMap[nextIndex].id)
        if (nextMap[nextIndex].added === undefined) {
          nextMap[nextIndex].added = true
          nextMap[nextIndex].id = Math.random().toString(36).substring(7)
        }
        nextIndex++
      }
    })
  })

  next.forEach((token, index) => {
    console.log(1, `D:${ token.deleted }`, `A:${ token.added }`, `id:${ token.id }`, token.content)
  })

  return next as (ThemedToken & { id: string })[]

}


function diffAlgo2(
  prev: (ThemedToken & { id: string })[],
  next: (ThemedToken & { id?: string })[],
) {
  // Flatten the offset
  let prevContent = ''
  prev.forEach((token, index) => {
    token.offset = prevContent.length
    prevContent += token.content
  })

  let nextContent = ''
  next.forEach((token, index) => {
    token.offset = nextContent.length
    nextContent += token.content
  })

  console.log("Prev", prev)
  console.log("Next", next)

  const testDiff = DiffMatchPatch.diff(
    prev.map(t => t.content).join(''),
    next.map(t => t.content).join(''),
  )
  DiffMatchPatch.diffCleanupSemanticLossless(testDiff)
  console.log(testDiff)

  // Find same diffs and compile the offset ranges of old and new
  const sameRanges: { prev: [number, number], next: [number, number] }[] = []
  prevContent = ''
  nextContent = ''

  testDiff.forEach((part, index) => {
    const mode = part[0]
    const text = part[1]
    if (mode === 0) {
      sameRanges.push({
        prev: [prevContent.length, prevContent.length + text.length],
        next: [nextContent.length, nextContent.length + text.length],
      })
      prevContent += text
      nextContent += text
    }
    if (mode === -1) {
      prevContent += text
    }
    if (mode === 1) {
      nextContent += text
    }
  })

  // Now we can find the same ranges and assign the same id
  sameRanges.forEach((entry) => {

  })


  // console.log("Diff", testDiff)
  // console.log("Diff Length", testDiff.reduce((acc, part) => acc + part[1].length, 0))




  // const flatDiff: {
  //   mode: 1 | -1 | 0,
  //   char: string,
  // }[] = []

  // testDiff.forEach((part) => {
  //   const mode = part[0]
  //   const chars = part[1]
  //   chars.split('').forEach((char) => {
  //     flatDiff.push({ mode, char })
  //   })
  // })


  // const newOutput: (ThemedToken & { id: string })[] = []

  // let diffCharIndex = 0
  // let nextCharIndex = 0
  // let prevIndex = 0
  // next.forEach((token) => {

  //   enum STATUS {
  //     SAME,
  //     ADD,
  //   }
  //   let status: STATUS | undefined = undefined
  //   token.content.split('').forEach((char) => {
  //     const diffChar = flatDiff[diffCharIndex]
  //     if (diffChar.mode === 0) {
  //       if (status !== undefined && status !== STATUS.SAME) {
  //         status = STATUS.ADD
  //       } else {
  //         status = STATUS.SAME
  //       }
  //       diffCharIndex++
  //     }
  //     if (diffChar.mode === 1) {
  //       status = STATUS.ADD
  //       diffCharIndex++
  //     }
  //     if (diffChar.mode === -1) {
  //       while (flatDiff[diffCharIndex] && flatDiff[diffCharIndex].mode === -1) {
  //         diffCharIndex++
  //       }
  //     }
  //     nextCharIndex++
  //   })

  //   console.log("Token", { v: token.content }, "Status", status ?? "")

  //   if (status === STATUS.ADD) {
  //     newOutput.push({ ...token, id: Math.random().toString(36).substring(7) })
  //     return
  //   }
  //   if (status === STATUS.SAME) {
  //     newOutput.push({ ...token, id: prev[prevIndex].id })
  //   }
  //   prevIndex++
  // })

  // console.log("NewOutput", newOutput)

  // return newOutput
}


function diffAlgo1(
  prev: (ThemedToken & { id: string })[],
  next: (ThemedToken & { id?: string })[]
) {
  // Diff the lines
  const diff = Diff.diffArrays(
    prev.map(token => token.content),
    next.map(token => token.content),
    {
      oneChangePerToken: true,
    }
  )

  // Process diff and assign ids
  let indexNew = 0
  let indexPrev = 0
  const newOutput: (ThemedToken & { id: string })[] = []
  diff.forEach(part => {
    const mode = part.added ? "+" : part.removed ? "-" : " "
    const count = part.count ?? 0
    let countIndex = 0
    while (countIndex < count) {
      if (mode === "+") {
        // console.log(0, "add", next[indexNew]?.content, prev[indexPrev]?.content)
        newOutput.push({ ...next[indexNew], id: Math.random().toString(36).substring(7) })
        indexNew++
      }
      if (mode === " ") {
        // console.log(0, "same", next[indexNew]?.content, prev[indexPrev]?.content)
        newOutput.push({ ...next[indexNew], id: prev[indexPrev].id })
        indexNew++
        indexPrev++
      }
      if (mode === "-") {
        // console.log(0, "rem", next[indexNew]?.content, prev[indexPrev]?.content)
        indexPrev++
      }
      countIndex++
    }
  })

  return newOutput
}