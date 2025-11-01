fetch("/data.json")
  .then((response) => response.json())
  .then((data) => {
    document.getElementById(
      "output"
    ).innerHTML = `<h3>JSON Data:</h3><pre>${JSON.stringify(
      data,
      null,
      2
    )}</pre>`;
  })
  .catch((err) => {
    document.getElementById("output").innerHTML = "Error loading JSON";
    console.error(err);
  });

fetch("/data.xml")
  .then((response) => response.text())
  .then((str) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(str, "application/xml");
    document.getElementById(
      "output"
    ).innerHTML += `<h3>XML Data:</h3><pre>${new XMLSerializer().serializeToString(
      xmlDoc
    )}</pre>`;
  })
  .catch((err) => {
    document.getElementById("output").innerHTML += "Error loading XML";
    console.error(err);
  });
