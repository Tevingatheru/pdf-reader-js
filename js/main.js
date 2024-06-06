var { pdfjsLib } = globalThis;

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.mjs";
let currentPage = 1;
var outputScale = window.devicePixelRatio || 1;

const testUrl = "public/pdf/Constitution-of-Kenya.pdf";
var totalPages = 0;
var scale = 1.5,
  canvas = document.getElementById("the-canvas"),
  context = canvas.getContext("2d");

function renderPage(pageNumber) {
  validateRequest(pageNumber);

  var pdfDocumentLoadingTask = getPdf();

  var result = renderPageToCanvas(pdfDocumentLoadingTask, pageNumber);

  updatePageCounter(pageNumber);
}

function getPdf() {
  return pdfjsLib
    .getDocument(testUrl);
}

function renderPageToCanvas(pdfDocumentLoadingTask, pageNumber) {
  return pdfDocumentLoadingTask
    .promise.then(function (pdf) {
      return pdf.getPage(pageNumber);
    })
    .then(function (pdfPageProxy) {
      var pageViewport = getPageViewport(pdfPageProxy);
      
      modifyCanvas(pageViewport);

      var transform = outputScale !== 1
        ? [outputScale, 0, 0, outputScale, 0, 0]
        : null;
      var renderContext = {
        canvasContext: context,
        transform: transform,
        viewport: pageViewport,
      };
      render(pdfPageProxy, renderContext);
    })
    .catch(function (error) {
      console.error("Error rendering PDF:", error);
    });
}

function getPageViewport(pdfPageProxy) {
  return pdfPageProxy.getViewport({ scale: scale });
}

function modifyCanvas(pageViewport) {
  if (!canvas || !context) {
    console.error("Error: canvas or context is undefined. ", canvas);
    return;
  }

  canvas.height = pageViewport.height;
  canvas.width = pageViewport.width;

  canvas.width = Math.floor(pageViewport.width * outputScale);
  canvas.height = Math.floor(pageViewport.height * outputScale);
  canvas.style.width = Math.floor(pageViewport.width) + "px";
  canvas.style.height = Math.floor(pageViewport.height) + "px";

}

async function render(pdfPageProxy, renderContext) {
  var renderTask;
  try {
    renderTask = executeRenderTask(pdfPageProxy, renderContext);
  } catch (e) {
    console.error("Error: ", e);
  }
}

function executeRenderTask(pdfPageProxy, renderContext) {
  try {
    return pdfPageProxy.render(renderContext);
  } catch (error) {
    throw new Error(error);
  }
}

async function updatePageCounter(num) {
  document.getElementById("page_num").textContent = num;
}

async function validateRequest(pageNumber) {
  if (typeof pdfjsLib === "undefined") {
    console.error("Error: pdfjsLib is not defined");
    return;
  }

  if (typeof pageNumber === "undefined" || pageNumber === null) {
    console.error("Error: pageNumber is undefined or null");
    return;
  }
}

document.getElementById("prev").addEventListener("click", function () {
  if (currentPage > 1) {
    currentPage--;
    renderPage(currentPage);
  }
});

document.getElementById("next").addEventListener("click", function () {
  if (currentPage < totalPages) {
    currentPage++;
    renderPage(currentPage);
  }
});

getPdf(testUrl)
.promise.then(function (pdf) {
    totalPages = pdf.numPages;
    
    document.getElementById("page_count").textContent = totalPages;

    renderPage(1);
  }, function (reason) {
    console.error(reason);
  });