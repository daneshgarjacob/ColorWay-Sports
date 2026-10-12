// Apple Vision "subject lift" for jersey product shots (macOS 14+ only).
// Local tool: scripts/make-jersey-cutouts.mjs compiles and drives it. Never runs on Vercel.
//
//   swiftc -O scripts/jersey-lift.swift -o /tmp/jersey-lift
//   /tmp/jersey-lift in.jpg out.png          # one file
//   printf 'in.jpg\tout.png\n' | /tmp/jersey-lift --batch   # many files, one per line
//
// Writes the soft foreground MASK (all instances) as an 8-bit grayscale PNG at the
// source's full size: white = jersey, black = background. The Node wrapper composes
// it with the original pixels (so it can fill holes Vision punches in white numbers).
// Prints one line per file: "ok <instances>" | "nosubject" | "loadfail" | "err <msg>".
import Foundation
import Vision
import CoreImage

let ctx = CIContext()
let gray = CGColorSpace(name: CGColorSpace.linearGray)!

func lift(_ inPath: String, _ outPath: String) -> String {
  guard let ci = CIImage(contentsOf: URL(fileURLWithPath: inPath)) else { return "loadfail" }
  let req = VNGenerateForegroundInstanceMaskRequest()
  let h = VNImageRequestHandler(ciImage: ci)
  do {
    try h.perform([req])
    guard let r = req.results?.first, r.allInstances.count > 0 else { return "nosubject" }
    let buf = try r.generateScaledMaskForImage(forInstances: r.allInstances, from: h)
    try ctx.writePNGRepresentation(of: CIImage(cvPixelBuffer: buf), to: URL(fileURLWithPath: outPath),
                                   format: .L8, colorSpace: gray)
    return "ok \(r.allInstances.count)"
  } catch { return "err \(error)" }
}

let args = CommandLine.arguments
if args.count >= 2 && args[1] == "--batch" {
  while let line = readLine() {
    let p = line.split(separator: "\t", maxSplits: 1).map(String.init)
    if p.count != 2 { print("err bad line"); continue }
    print(lift(p[0], p[1]))
    fflush(stdout)
  }
} else if args.count == 3 {
  let s = lift(args[1], args[2])
  print(s)
  exit(s.hasPrefix("ok") ? 0 : 2)
} else {
  print("usage: jersey-lift in out | jersey-lift --batch < pairs.tsv"); exit(1)
}
