import React, { Component } from "react";
import Button from "material-ui/Button";
import Icon from "material-ui/Icon";
import Snackbar from "./Snackbar";
import { CircularProgress } from "material-ui/Progress";

const style = {
  position: "fixed",
  bottom: "16px",
  right: "16px",
};

class ClipboardSyncButton extends Component {
  constructor() {
    super();
    this.state = {
      clipboardSyncing: false,
    };
  }

  render() {
    return (
      <div>
        <Button
          variant="fab"
          color="secondary"
          style={style}
          onClick={this.syncClipboard}
          onKeyPress={this.handleKeyPress}
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
        <Snackbar message="Clipboard Synced" identity="syncClipboard" />
      </div>
    );
  }

  syncClipboard = () => {
    this.setState({ clipboardSyncing: true });

    navigator.permissions.query({ name: "clipboard-read" }).then((result) => {
      // If permission to read the clipboard is granted or if the user will
      // be prompted to allow it, we proceed.

      if (result.state == "granted" || result.state == "prompt") {
        navigator.clipboard.readText().then((text) => {
          const queryOptions = {
            method: "post",
            body: JSON.stringify({ text }),
            headers: {
              'Content-Type': 'application/json'
            },
          };
          fetch("/api/text", queryOptions).then((response) => {
            document.getElementById("syncClipboardSnackbarShowButton").click();
            this.setState({ clipboardSyncing: !this.state.clipboardSyncing });
          });
        });
      } else {
      }
    });
  }

  handleKeyPress = (event) => {
    if(event.key === 'Enter'){
      console.log('enter press here! ')
    }
  }
}

export default ClipboardSyncButton;
