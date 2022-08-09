import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useSliceSelector, useSliceStore } from '../utils/reduxHelper';

export default function SaveDesignModal() {
  const store = useSliceStore('app');
  const [showSaveDesignModal] = useSliceSelector('app', ['showSaveDesignModal']);
  const [fileName, setFileName] = useState("");

  function saveDesign() {
    if (fileName.trim() === '') {
      alert("Please enter a valid file name.");
      return;
    }
    let savedFileName = fileName;

    if (!savedFileName.endsWith(".json")) {
      savedFileName += ".json";
    }

    const { tableList } = store.getState();
    console.log('tableList0=', tableList);
    const data = JSON.stringify({ tableList });
    var link = document.createElement('a');
    link.setAttribute('download', savedFileName);
    link.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(data));
    link.click();

    store.setState({
      modified: false,
      showSaveDesignModal: false
    });
  }

  function hide() {
    store.setState({
      showSaveDesignModal: false
    });
  }

  return (
    <Modal show={showSaveDesignModal} onHide={hide}>
      <Modal.Header closeButton>
        <Modal.Title>
          Save Design As
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          <label className="mb-1">File name:</label>
          <input className="form-control" type="text" value={fileName}
            onChange={e => setFileName(e.target.value)}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-primary" onClick={saveDesign}>
          Save
        </button>
      </Modal.Footer>
    </Modal>
  )
}