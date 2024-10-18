const Tax = require('../models/appmodel/Taxes');

// Create a new tax
exports.createTax = async (req, res) => {
  const { name, taxvalue, isActive, isDefault, createdBy } = req.body;

  try {
    const newTax = new Tax({
      name,
      taxvalue,
      isActive,
      isDefault,
      createdBy,
    });

    const savedTax = await newTax.save();
    res.status(201).json(savedTax);
  } catch (error) {
    res.status(500).json({ message: 'Error creating tax', error });
  }
};

// Get all taxes or filter by createdBy
exports.getTaxes = async (req, res) => {
  const { createdBy,isActive } = req.query;

  try {
    const filter = {};

    if (createdBy) {
      filter.createdBy = createdBy;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    const taxes = await Tax.find(filter);
    res.status(200).json(taxes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching taxes', error });
  }
};

// Get a single tax by ID
exports.getTaxById = async (req, res) => {
  const { id } = req.params;

  try {
    const tax = await Tax.findById(id);
    if (!tax) return res.status(404).json({ message: 'Tax not found' });

    res.status(200).json(tax);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tax', error });
  }
};

// Update a tax by ID
exports.updateTax = async (req, res) => {
  const { id } = req.params;
  const { name, value, isActive, isDefault } = req.body;

  try {
    const updatedTax = await Tax.findByIdAndUpdate(
      id,
      { name, value, isActive, isDefault },
      { new: true }
    );

    if (!updatedTax) return res.status(404).json({ message: 'Tax not found' });

    res.status(200).json(updatedTax);
  } catch (error) {
    res.status(500).json({ message: 'Error updating tax', error });
  }
};

// Delete a tax by ID
exports.deleteTax = async (req, res) => {
  const { id } = req.params;

  try {
    const tax = await Tax.findByIdAndDelete(id);
    if (!tax) return res.status(404).json({ message: 'Tax not found' });

    res.status(200).json({ message: 'Tax deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tax', error });
  }
};
