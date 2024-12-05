const express = require("express");
const mongoose = require('mongoose');
const app  = express();
require('./config/database.js')
require('./config/passportGoogleAth.js')
const Admin = require('./models/coreModel/admin.js'); // Adjust the path as necessary
const adminRouter=require('./routes/adminRoutes.js')
const authRouteGoogle=require('./routes/authGoogle.js')
const personRouter=require('./routes/personRoutes.js')
const entrepriseRouter=require('./routes/entrepriseRoutes.js')
const clientRouter=require('./routes/clientRoutes.js')
const ProductCategory=require('./routes/ProductCategoryRoutes.js')
const Product=require('./routes/ProductRoutes.js')
const depenseCategoryRoutes = require('./routes/DepenseCategoryRoutes.js');
const Depense = require('./routes/DepenseRoutes.js');
const Currency = require('./routes/currencyRoutes.js');
const taxRoutes = require('./routes/TaxeRoutes.js');
const companySettingRoutes = require('./routes/EntrepriseSettingRoutes.js');
const invoiceRoutes = require('./routes/invoiceRoutes');
const payment = require('./routes/PaymentRoutes.js');
const flouci = require('./routes/flouciPyamentRoutes.js');
const superAdminRoutes = require('./routes/SuperAdminRoutes.js');
const session = require('express-session');
const MongoStore = require('connect-mongo')
var cors = require('cors');
const passport = require('passport');
// use it before all route definitions
app.use(cors())
const detenv = require('dotenv').config()
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(
    session({
      secret: 'your_secret_key',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl:process.env.MONGODB_URI}),
    })
  );
// Session setup
 app.use(passport.initialize());
  app.use(passport.session());
app.use(bodyParser.json());
app.listen(process.env.PORT,()=>{
    console.log(`server is running in port ${process.env.PORT}`);
})
app.use('/api/',adminRouter);
app.use('/api/people/',personRouter);
app.use('/api/entreprise/',entrepriseRouter);
app.use('/api/client/',clientRouter);
app.use('/api/category/',ProductCategory);
app.use('/api/product/',Product);
app.use("/auth", authRouteGoogle);
app.use("/uploads", express.static("uploads"));
app.use('/api/depense-categories', depenseCategoryRoutes);
app.use('/api/depense', Depense);
app.use('/api/currency', Currency);
app.use('/api/companysetting', companySettingRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', payment);
app.use('/api/flouci', flouci);
app.use('/superadmin', superAdminRoutes);