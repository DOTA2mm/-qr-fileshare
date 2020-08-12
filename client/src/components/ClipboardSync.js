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
      sync: 0,
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
        <Snackbar message={ this.sync ? "Clipboard Synced" : "Copied to clipboard" } identity="syncClipboard" />
      </div>
    );
  }

  syncClipboard = () => {
    this.setState({ clipboardSyncing: true, sync: 1 });

    navigator.permissions.query({ name: "clipboard-read" }).then((result) => {
      // If permission to read the clipboard is granted or if the user will
      // be prompted to allow it, we proceed.

      if (result.state === "granted" || result.state === "prompt") {
        navigator.clipboard.readText().then((text) => {
          const queryOptions = {
            method: "post",
            body: JSON.stringify({ text }),
            headers: {
              'Content-Type': 'application/json'
            },
          };
          fetch("/api/clipboard", queryOptions).then((response) => {
            document.getElementById("syncClipboardSnackbarShowButton").click();
            this.setState({ clipboardSyncing: !this.state.clipboardSyncing });
          });
        });
      } else {
        console.log(result);
        console.log(document.execCommand('paste'));
      }
    }).catch(e => {
      console.log(e)
    });
  }

  getClipboard = () => {
    this.setState({ clipboardSyncing: true, sync: 0 });

    navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
      // If permission to read the clipboard is granted or if the user will
      // be prompted to allow it, we proceed.

      if (result.state === "granted" || result.state === "prompt") {
        fetch("/api/clipboard").then(response => response.text()).then(text => {

          document.getElementById("syncClipboardSnackbarShowButton").click();
          this.setState({ clipboardSyncing: !this.state.clipboardSyncing });
          navigator.clipboard.writeText(text);
        });
      } else {
      }
    });
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

export default ClipboardSyncButton;
