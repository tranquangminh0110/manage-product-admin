const Product = require("../../models/product.model");
const { objectTextSearch, capitalize } = require("../../utils/search-helper");
const { pagination } = require("../../utils/pagination-helper");
const systemConfig = require("../../config/system");
/**
 * Lấy ra list sản phẩm và filter
 * @method GET - /admin/products
 * @return page index
 */
const index = async (req, res) => {
  try {
    let currentStatus;
    let sortByPosition = req.query.sortByPosition || "desc";
    let queryString = {
      deleted: false,
    };

    const objectSearch = objectTextSearch(req.query);

    let objectPagination = pagination(req.query, { limit: 5, skip: 0 });

    if (req.query.status) {
      queryString.status = req.query.status;
      currentStatus = capitalize(req.query.status);
    }

    if (objectSearch.title) {
      queryString.title = objectSearch.title;
    }

    // count of total document of collection
    const countData = await Product.countDocuments(queryString);
    const totalPage = Math.ceil(countData / objectPagination.limit);
    objectPagination.totalPage = totalPage;

    // query data from Database
    const data = await Product.find(queryString)
      .sort({ position: sortByPosition })
      .limit(objectPagination.limit)
      .skip(objectPagination.skip);

    res.render("admin/pages/product/index", {
      title: "List Products",
      products: data,
      currentStatus: currentStatus || "All",
      textSearch: objectSearch.textSearch,
      currentPage: objectPagination.currentPage,
      totalPage: objectPagination.totalPage,
      skipIndex: objectPagination.skip,
      textSortBy: sortByPosition,
    });
  } catch (error) {
    res.render("./admin/pages/not-found/index");
  }
};

/**
 * Thay đổi trạng thái của sản phẩm
 * @method PATCH - /admin/products/change-status/:status/:productId
 */
const changeStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const productId = req.params.productId;

    const response = await Product.updateOne(
      { _id: productId },
      { status: status }
    );

    req.flash("success", "Product status have been changed.");
    res.redirect("back");
  } catch (error) {
    console.log(error);
  }
};

/**
 * Thay đổi trạng thái của nhiều sản phẩm
 * @method PATCH - /admin/products/change-multiple-status
 */
const changeMultiStatus = async (req, res) => {
  try {
    const ids = req.body.ids.split(",");
    const type = req.body.type;

    switch (type) {
      case "active":
        await Product.updateMany(
          {
            _id: { $in: ids },
          },
          {
            status: "active",
          }
        );
        req.flash("success", `${ids.length} products have been actived.`);
        break;

      case "inactive":
        await Product.updateMany(
          {
            _id: { $in: ids },
          },
          {
            status: "inactive",
          }
        );
        req.flash("success", `${ids.length} products have been inactived.`);
        break;

      case "delete":
        await Product.updateMany(
          {
            _id: { $in: ids },
          },
          {
            deleted: true,
            deletedAt: new Date(),
          }
        );
        req.flash("success", `${ids.length} products have been deleted.`);
        break;

      case "change-position":
        for (const item of ids) {
          const [productId, positionIndex] = item.split("-");
          await Product.updateOne(
            { _id: productId },
            { position: parseInt(positionIndex) }
          );
        }
        req.flash(
          "success",
          `${ids.length} products position have been saved.`
        );
        break;
      default:
        m;
        break;
    }
    res.redirect("back");
  } catch (error) {}
};

/**
 * Xoá mềm - Thay đổi deleted = true
 * @method DELETE - /admin/products/delete-product/:productId
 */
const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    await Product.updateOne(
      { _id: productId },
      {
        deleted: true,
        deletedAt: new Date(),
      }
    );
    req.flash("success", "Product have been deleted.");
    res.redirect("back");
  } catch (error) {}
};

/**
 * Trả về giao diện trang create product
 * @method GET
 * @return page create product
 */

const create = async (req, res) => {
  try {
    res.render("admin/pages/product/create", { title: "Create new product" });
  } catch (error) {}
};

/**
 * Tạo mới một sản phẩm
 * @method POST
 * @return page create product
 */
const createProduct = async (req, res) => {
  try {
    req.body.price = parseInt(req.body.price);
    req.body.discountPercentage = parseInt(req.body.discountPercentage);
    req.body.stock = parseInt(req.body.stock);

    if (req.file) {
      req.body.thumbnail = `/uploads/${req.file.filename}`;
    }

    if (req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      req.body.position = await Product.countDocuments({ deleted: false });
    }

    const product = new Product(req.body);
    await product.save();
    req.flash("success", "Create new product success");
  } catch (error) {
    req.flash("error", "Create new product error");
  } finally {
    res.redirect(`${systemConfig.prefixAdmin}/products`);
  }
};

/**
 * Trả về trang sửa sản phẩm
 * @method GET
 * @return page edit product
 */
const edit = async (req, res) => {
  try {
    const productId = req.params.productId;
    let find = {
      deleted: false,
      _id: productId,
    };

    const productData = await Product.findOne(find);

    res.render(`admin/pages/product/edit`, {
      title: "Edit product",
      productData: productData,
    });
  } catch (error) {}
};

/**
 * Update sản phẩm
 * @param {*} req
 * @param {*} res
 */
const editProduct = async (req, res) => {
  req.body.price = parseInt(req.body.price);
  req.body.discountPercentage = parseInt(req.body.discountPercentage);
  req.body.stock = parseInt(req.body.stock);
  req.body.position = parseInt(req.body.position);

  if (req.file) {
    req.body.thumbnail = `/uploads/${req.file.filename}`;
  }

  try {
    await Product.updateOne({ _id: req.params.productId }, req.body);
    req.flash("success", "Update was successful");
  } catch (error) {
    req.flash("error", "Update was error");
  } finally {
    res.redirect("back");
  }
};

module.exports = {
  create,
  index,
  deleteProduct,
  changeMultiStatus,
  changeStatus,
  createProduct,
  edit,
  editProduct,
};
