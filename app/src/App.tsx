import React, { useState, useEffect } from 'react';
import './App.css';
import MsgReader from '@kenjiuno/msgreader';

interface Attachment {
  fileName: string;
  downloadUrl: string;
}

async function loadMsgFromAsync(file: File, onSetAttachments: (them: Attachment[]) => void) {
  const msgRead = new MsgReader(await file.arrayBuffer());
  const attachments = msgRead.getFileData().attachments;
  if (attachments) {
    onSetAttachments(
      attachments
        .map(
          attachment => {
            const attachmentEntity = msgRead.getAttachment(attachment);
            return {
              fileName: attachmentEntity.fileName,
              downloadUrl: URL.createObjectURL(new Blob([attachmentEntity.content])),
            };
          }
        )
    );
  }
  else {
    onSetAttachments([]);
  }
}

function App() {
  const [files, setFiles] = useState([] as File[]);
  const [attachments, setAttachments] = useState([] as Attachment[]);

  useEffect(
    () => {
      if (1 <= files.length) {
        loadMsgFromAsync(
          files[0],
          them => setAttachments(them)
        );
      }
    },
    [files]
  );

  return (<>
    <h1>msgreader_demo2</h1>
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
        Attachment files here:<br />
        <ul>
          {
            (attachments.length === 0)
              ? <li>No attachment files detected for now</li>
              : attachments.map(
                attachment => <li>
                  <a download={attachment.fileName} href={attachment.downloadUrl}>{attachment.fileName}</a>
                </li>
              )
          }
        </ul>
      </p>
    </div>
  </>);
}

export default App;
