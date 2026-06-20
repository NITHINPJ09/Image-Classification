//========================================================================
// Drag and drop image handling
//========================================================================

const fileDrag = document.getElementById("file-drag");
const fileSelect = document.getElementById("file-upload");

// Add event listeners
fileDrag.addEventListener("dragover", fileDragHover, false);
fileDrag.addEventListener("dragleave", fileDragHover, false);
fileDrag.addEventListener("drop", fileSelectHandler, false);
fileSelect.addEventListener("change", fileSelectHandler, false);

function fileDragHover(e) {
  // prevent default behaviour
  e.preventDefault();
  e.stopPropagation();

  fileDrag.className =
    e.type === "dragover" ? "upload-box dragover" : "upload-box";
}

function fileSelectHandler(e) {
  // handle file selecting
  const files = e.target.files || e.dataTransfer.files;
  fileDragHover(e);
  for (let i = 0, f; (f = files[i]); i++) {
    previewFile(f);
  }
}

//========================================================================
// Web page elements for functions to use
//========================================================================

const imagePreview = document.getElementById("image-preview");
const uploadCaption = document.getElementById("upload-caption");
const predResult = document.getElementById("pred-result");
const loader = document.getElementById("loader");

//========================================================================
// Main button events
//========================================================================

function submitImage() {
  // action for the submit button
  if (!imagePreview.src || !imagePreview.src.startsWith("data")) {
    window.alert("Please select an image before submit.");
    return;
  }

  loader.classList.remove("hidden");
  imagePreview.classList.add("loading");

  // call the predict function of the backend
  predictImage(imagePreview.src);
}

function clearImage() {
  // reset selected files
  fileSelect.value = "";

  // remove image source and hide it
  imagePreview.src = "";
  predResult.textContent = "";

  hide(imagePreview);
  hide(loader);
  hide(predResult);
  show(uploadCaption);

  imagePreview.classList.remove("loading");
}

function previewFile(file) {
  // show the preview of the image
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = () => {
    imagePreview.src = reader.result;

    show(imagePreview);
    hide(uploadCaption);

    // reset
    predResult.textContent = "";
    hide(predResult);
    imagePreview.classList.remove("loading");
  };
}

//========================================================================
// Helper functions
//========================================================================

function predictImage(image) {
  fetch("/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(image)
  })
    .then(resp => {
      if (!resp.ok) {
        return resp
          .json()
          .catch(() => ({}))
          .then(data => {
            throw new Error(
              data.error || "Request failed (" + resp.status + ")."
            );
          });
      }
      return resp.json().then(displayResult);
    })
    .catch(err => {
      console.error("Prediction request failed:", err.message);
      resetAfterError();
      window.alert(err.message || "Oops! Something went wrong.");
    });
}

function displayResult(data) {
  // display the result over the image, and lift the dim once it's shown
  hide(loader);
  imagePreview.classList.remove("loading");
  predResult.textContent = data.result;
  show(predResult);
}

function resetAfterError() {
  // clear the loading state so the UI doesn't hang on a failed request
  hide(loader);
  hide(predResult);
  imagePreview.classList.remove("loading");
}

function hide(el) {
  // hide an element
  el.classList.add("hidden");
}

function show(el) {
  // show an element
  el.classList.remove("hidden");
}
