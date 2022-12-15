import React from 'react';
import Modal from 'react-modal';
// https://www.npmjs.com/package/react-modal
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '70vw',
  },
};

Modal.setAppElement('#root');

export function ModalComponent({ children }) {
  let subtitle;
  const [modalIsOpen, setIsOpen] = React.useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
    subtitle.style.color = '#f00';
  }

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <div>
      <div onClick={openModal}>Settings</div>
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Settings"
      >
        <h2 ref={(_subtitle) => (subtitle = _subtitle)}>Settings</h2>
        {children}
        <button onClick={closeModal}>close</button>
      </Modal>
    </div>
  );
}
