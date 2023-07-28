import React, { useState, useEffect } from 'react';
import './App.css';
import MsgReader from '@kenjiuno/msgreader';
import { decompressRTF } from '@kenjiuno/decompressrtf';
import iconv from 'iconv-lite';
import { Buffer } from 'buffer';
import { deEncapsulateSync } from 'rtf-stream-parser';

// Buffer is not defined
// ReferenceError: Buffer is not defined
//     at Tokenize._transform (http://localhost:3000/msgreader_demo3/static/js/bundle.js:50304:42)
//     at deEncapsulateSync (http://localhost:3000/msgreader_demo3/static/js/bundle.js:50014:11)
//     at http://localhost:3000/msgreader_demo3/static/js/bundle.js:63:92
//     at parseMsgFileAsync (http://localhost:3000/msgreader_demo3/static/js/bundle.js:49:5)

// ↓ is a workaround for ↑

window.Buffer = Buffer;

// ---

// Module not found: Error: Can't resolve 'stream' in 'V:\msgreader_demo3\app\node_modules\rtf-stream-parser\dist\src'

// BREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default.
// This is no longer the case. Verify if you need this module and configure a polyfill for it.

// If you want to include a polyfill, you need to:
// 	- add a fallback 'resolve.fallback: { "stream": require.resolve("stream-browserify") }'
// 	- install 'stream-browserify'
// If you don't want to include a polyfill, you can use an empty module like this:
// 	resolve.fallback: { "stream": false }

// Include ↓ at package.json (yarn) as a workaround of ↑

// {
//   "dependencies": {
//     "stream": "npm:stream-browserify@3.0.0"
//   },
// }

// ---

async function parseMsgFileAsync(
  file: File,
  onSetRtf: (rtf: string) => void,
  onSetRtfBlob: (rtfBlob: number[]) => void
) {
  const msgRead = new MsgReader(await file.arrayBuffer());
  const { compressedRtf } = msgRead.getFileData();
  if (compressedRtf) {
    const rtfBlob = decompressRTF(Array.from(compressedRtf));
    onSetRtfBlob(rtfBlob);
    onSetRtf(
      iconv.decode(
        Buffer.from(rtfBlob),
        "latin1"
      )
    );
  }
  else {
    onSetRtfBlob([]);
    onSetRtf("");
  }
}

function App() {
  const [files, setFiles] = useState([] as File[]);
  const [rtf, setRtf] = useState("");
  const [rtfHref, setRtfHref] = useState("");
  const [htmlHref, setHtmlHref] = useState("");
  const [html, setHtml] = useState("");

  useEffect(
    () => {
      if (1 <= files.length) {
        parseMsgFileAsync(
          files[0],
          rtfText => {
            setRtf(rtfText);

            if (rtfText.length !== 0) {
              try {
                const result = deEncapsulateSync(rtfText, { decode: iconv.decode });
                setHtml(result.text + "");
                setHtmlHref(URL.createObjectURL(new Blob([result.text])));
              }
              catch (ex) {
                setHtml(ex + "");
                setHtmlHref("");
              }
            }
            else {
              setHtml("");
              setHtmlHref("");
            }
          },
          rtfBlob => {
            setRtfHref(
              URL.createObjectURL(
                new Blob(
                  [
                    Buffer.from(rtfBlob)
                  ]
                )
              )
            )
          }
        );
      }
    },
    [files]
  );

  return (<>
    <h1>msgreader_demo3</h1>
    <div>
      <p>
        Load msg file here:
      </p>
      <ul>
        <li>
          <input type="file" onChange={e => setFiles(Array.from(e.target.files || []))} />
        </li>
      </ul>
      <p>
        RTF ({rtfHref && <a href={rtfHref} download="file.rtf">Download</a>}) decompressed with <a href="https://www.npmjs.com/package/@kenjiuno/decompressrtf" target='_blank' rel='noreferrer'>@kenjiuno/decompressrtf</a>:<br />
        <blockquote>
          <textarea value={rtf} cols={120} rows={20} />
        </blockquote>
      </p>
      <p>
        HTML ({htmlHref && <a href={htmlHref} download="file.html">Download</a>}) converted with <a href="https://www.npmjs.com/package/rtf-stream-parser" target='_blank' rel='noreferrer'>rtf-stream-parser</a>:<br />
        <blockquote>
          <textarea value={html} cols={120} rows={20} />
        </blockquote>
      </p>
    </div >
  </>);
}

export default App;
