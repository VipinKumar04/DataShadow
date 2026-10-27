require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const app = require("./app");

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`DataShadow backend listening on port ${port}`);
});
