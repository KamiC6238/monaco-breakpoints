export {default as MonacoBreakpoint} from './core';

import '@/style/global.css'
import * as monaco from "monaco-editor";
import { MonacoBreakpoint } from "monaco-breakpoints";

const democode = [
  "function foo() {\n",
  "\treturn 1;\n",
  "}\n",
  "function bar() {\n",
  "\treturn 1;\n",
  "}",
].join("");

const editor = monaco.editor.create(document.getElementById("app")!, {
  value: democode,
  theme: "vs-dark",
  glyphMargin: true,
});

const instance = new MonacoBreakpoint({ editor });

instance.on("breakpointChanged", (breakpoints) => {
  console.log("breakpointChanged: ", breakpoints);
});