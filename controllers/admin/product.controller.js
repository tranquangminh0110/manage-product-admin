/**
 * @method GET - /admin/products
 *
 */

module.exports.index = (req, res) => {
  res.render("./admin/pages/product/index", {
    title: "List Products",
  });
};