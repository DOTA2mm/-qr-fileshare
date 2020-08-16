import React, { Component } from "react";
import Button from "material-ui/Button";
import Icon from "material-ui/Icon";
import Snackbar from "./Snackbar";
import { CircularProgress } from "material-ui/Progress";

const syncStyle = {
  position: "fixed",
  bottom: "146px",
  right: "16px",
};
const getStyle = {
  position: "fixed",
  bottom: "82px",
  right: "16px",
};

class ClipboardSyncButton extends Component {
  constructor() {
    super();
    this.syncBtn = React.createRef();
    this.getBtn = React.createRef();
    this.state = {
      resInfo: '',
      clipboardSyncing: false,
    };
  }

  render() {
    return (
      <div>
        <Button
          variant="fab"
          color="secondary"
          style={syncStyle}
          onClick={this.syncClipboard}
          ref={this.syncBtn}
        >
          {this.state.clipboardSyncing ? (
            <CircularProgress
              variant="indeterminate"
              style={{ color: "#FFF" }}
              size={30}
              thickness={5}
            />
          ) : (
            <Icon>cloud_upload</Icon>
          )}
        </Button>

        <Button
          variant="fab"
          color="secondary"
          style={getStyle}
          onClick={this.getClipboard}
          ref={this.getBtn}
        >
          {this.state.clipboardSyncing ? (
            <CircularProgress
              variant="indeterminate"
              style={{ color: "#FFF" }}
              size={30}
              thickness={5}
            />
          ) : (
            <Icon>cloud_download</Icon>
          )}
        </Button>
        <Snackbar message={this.state.resInfo} identity="syncClipboard" />
      </div>
    );
  }

  syncClipboard = () => {
    function syncToRemote (text) {
      const queryOptions = {
        method: "post",
        body: JSON.stringify({ text }),
        headers: {
          'Content-Type': 'application/json'
        },
      };
      return fetch("/api/clipboard", queryOptions)
    }

    this.setState({ clipboardSyncing: true });

    if (navigator.permissions) {
      navigator.permissions.query({ name: "clipboard-read" }).then((result) => {
        // If permission to read the clipboard is granted or if the user will
        // be prompted to allow it, we proceed.
  
        if (result.state === "granted" || result.state === "prompt") {
          navigator.clipboard.readText().then((text) => {
            syncToRemote(text).then((response) => {
              this.setState({ resInfo: 'Sync Success.' })
              console.log(this);
            });
          });
        } else {
          this.setState({ resInfo: 'Sync Faile.' })
        }
      }).catch(e => {
        console.log(e);
        this.setState({ resInfo: 'Sync Faile.' })
      }).finally(() => {
        this.setState({ clipboardSyncing: false });
        setTimeout(() => {
          document.getElementById("syncClipboardSnackbarShowButton").click();
        })
      });
    } else {
      syncToRemote(new Clip().read()).then(() => {
        this.setState({ clipboardSyncing: false, resInfo: 'Sync Success.' });
      }).catch(e => {
        this.setState({ clipboardSyncing: false, resInfo: 'Sync Faile.' });
      }).finally(() => {
        setTimeout(() => {
          document.getElementById("syncClipboardSnackbarShowButton").click();
        })
      })
    }
  }

  getClipboard = () => {
    this.setState({ clipboardSyncing: true });

    if (navigator.permissions) {
      navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
        // If permission to read the clipboard is granted or if the user will
        // be prompted to allow it, we proceed.
  
        if (result.state === "granted" || result.state === "prompt") {
          fetch("/api/clipboard").then(response => response.text()).then(text => {
            navigator.clipboard.writeText(text);
            this.setState({ resInfo: 'Get Success.' })
          });
        } else {
          console.log(result);
          this.setState({ resInfo: 'Get Faile.' })
        }
      }).catch(e => {
        console.log(e);
        this.setState({ resInfo: 'Get Faile.' })
      }).finally(() => {
        this.setState({ clipboardSyncing: false });
        setTimeout(() => {
          document.getElementById("syncClipboardSnackbarShowButton").click();
        })
      });
    } else {
      fetch("/api/clipboard").then(response => response.text()).then(text => {
        new Clip().write(text)
        this.setState({ clipboardSyncing: false, resInfo: 'Get Success.' })
      }).catch(e => {
        this.setState({ clipboardSyncing: false, resInfo: 'Get Faile.' });
      }).finally(() => {
        setTimeout(() => {
          document.getElementById("syncClipboardSnackbarShowButton").click();
        })
      })
    }

  }

  componentDidMount() {
    const _self = this;
    document.addEventListener('keypress', (ev) => {
      // 's' means Sync clipboard
      if (ev.keyCode === 115) {
        _self.syncBtn.current.props.onClick();
      } else if (ev.keyCode === 103) {
        _self.getBtn.current.props.onClick();
      }
    })
  }
}

class Clip {
  constructor() {
    this.el = document.createElement('textarea')
  }
  read() {
    document.body.appendChild(this.el)
    this.el.focus()
    document.execCommand('paste')
    this.el.blur()
    const text = this.el.value
    document.body.removeChild(this.el)
    return text
  }
  write(text) {
    document.body.appendChild(this.el)
    this.el.value = text
    const range = document.createRange()
    range.selectNodeContents(this.el)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    this.el.setSelectionRange(0, 999999)
    document.execCommand('copy')
    document.body.removeChild(this.el)
  }
}

export default ClipboardSyncButton;
