// ✅ Import required modules
const express = require("express");
const multer = require("multer");
const exceljs = require("exceljs");
const Sale = require("../models/Sale");
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// ✅ File Upload Route (Insert or Update)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("❌ No file uploaded.");
      return res.status(400).json({ message: "No file uploaded." });
    }

    const workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const worksheet = workbook.worksheets[0]; // Assuming first sheet contains data
    const salesData = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        let deliveryDateValue = row.getCell(11).value;
        let deliveryDate = null;

        if (deliveryDateValue) {
          // Handle both Excel date format (numbers) & string dates
          if (typeof deliveryDateValue === "number") {
            deliveryDate = new Date(Math.round((deliveryDateValue - 25569) * 86400 * 1000)); // Convert Excel serial date to JS date
          } else if (!isNaN(Date.parse(deliveryDateValue))) {
            deliveryDate = new Date(deliveryDateValue);
          }
        }

        // Validate numeric fields to ensure they are numbers
        if (
          isNaN(row.getCell(5).value) ||
          isNaN(row.getCell(6).value) ||
          isNaN(row.getCell(7).value) ||
          isNaN(row.getCell(9).value)
        ) {
          console.error(`❌ Invalid data at row ${rowNumber}`);
          return; // Skip invalid rows
        }

        let gstValue = row.getCell(6).value;
        if (gstValue) {
          gstValue = gstValue * 100;  // Multiply by 100 to store as a percentage
        }

        salesData.push({
          orderNo: row.getCell(1).value,
          clientName: row.getCell(2).value,
          location: row.getCell(3).value,
          entryPerson: row.getCell(4).value,
          basicOrderValue: row.getCell(5).value,
          GST: gstValue,
          totalOrderValue: row.getCell(7).value,
          vendorsName: row.getCell(8).value,
          orderValue: row.getCell(9).value,
          payment: row.getCell(10).value,
          deliveryDate: deliveryDate, // Fixed date parsing
          status: row.getCell(12).value,
          remarks: row.getCell(13).value,
        });
      }
    });

    const insertPromises = [];
    const updatePromises = [];

    for (const sale of salesData) {
      const existingSale = await Sale.findOne({ orderNo: sale.orderNo });

      if (existingSale) {
        updatePromises.push(Sale.updateOne({ orderNo: sale.orderNo }, { $set: sale }));
      } else {
        insertPromises.push(Sale.create(sale));
      }
    }

    // Await insertion and update operations
    const insertedOrderIds = await Promise.all(insertPromises);
    const updatedOrderIds = await Promise.all(updatePromises);

    // Delete the uploaded file after processing
    await fs.promises.unlink(req.file.path);

    res.status(201).json({
      message: "✅ Data successfully uploaded & stored in MongoDB!",
      insertedOrders: insertedOrderIds.length > 0 ? insertedOrderIds : "No new orders inserted",
      updatedOrders: updatedOrderIds.length > 0 ? updatedOrderIds : "No existing orders updated",
    });
  } catch (error) {
    console.error("❌ Error processing file:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// ✅ API to Fetch All Sales Data
router.get("/sales", async (req, res) => {
  try {
    const sales = await Sale.find({}, "orderNo clientName location entryPerson");
    res.json(sales);
  } catch (error) {
    console.error("❌ Error fetching sales data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ API to Fetch Order Details by orderNo
router.get("/sales/:orderNo", async (req, res) => {
  try {
    const { orderNo } = req.params;
    const order = await Sale.findOne({ orderNo: orderNo });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const formattedOrder = {
      ...order.toObject(),
      status: order.status || "N/A", // Ensure it's always a string, default to "N/A" if empty
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error("❌ Error fetching order details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
