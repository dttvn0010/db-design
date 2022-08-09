import { Modal } from 'react-bootstrap';
import { useSliceSelector, useSliceStore } from '../utils/reduxHelper';

export default function LoadDesignModal() {
  const store = useSliceStore('app');
  const [showLoadDesignModal] = useSliceSelector('app', ['showLoadDesignModal']);

  function loadDesign(e) {
    const { modified } = store.getState();

    if (modified && !window.confirm("Current design has not been saved? Do you want to continue?")) {
      store.setState({
        showLoadDesignModal: false
      });
      return;
    }

    let files = e.target.files;
    let reader = new FileReader();

    reader.onload = function (e) {
      const data = JSON.parse(e.target.result);
      console.log('data=', data);
      store.setState({
        ...data,
        showLoadDesignModal: false,
        modified: false
      });
    }

    reader.readAsText(files[0]);
  }

  function hide() {
    store.setState({
      showLoadDesignModal: false
    });
  }

  return (
    <Modal show={showLoadDesignModal} onHide={hide}>
      <Modal.Header closeButton>
        <Modal.Title>
          Load design from file
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          <label className="mb-1">Select a file to load:</label>
          <input id="file" className="form-control" type="file"
            onChange={loadDesign}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={hide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  )
}