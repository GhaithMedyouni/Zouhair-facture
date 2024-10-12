import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Row,
    Col,
    FormGroup,
    Label
} from 'reactstrap';
import { toast } from 'react-toastify';

const EditInvoiceModal = ({ isOpen, toggle, invoiceData, refreshInvoices, userId }) => {
    console.log(invoiceData)
    const [invoice, setInvoice] = useState({
        client: '',
        number: 1,
        year: new Date().getFullYear(),
        currency: '',
        status: 'Brouillon',
        date: new Date().toISOString().substring(0, 10),
        note: '',
        items: [{ article: '', description: '', quantity: 1, price: 0, total: 0 }],
        paidAmount: 0,
        tax: invoiceData ? invoiceData.tax : {},
    });


    const [taxOptions, setTaxOptions] = useState([]);
    const [selectedTax, setSelectedTax] = useState('');
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState('');


    const [taxAmount, setTaxAmount] = useState(0);
    const [invoiceTotal, setInvoiceTotal] = useState(0);
    const [clientOptions, setClientOptions] = useState([]);
    const [currencyOptions, setCurrencyOptions] = useState([]);
    const [statusOptions] = useState(['Brouillon', 'Envoyé', 'Annulé']);
    const [productOptions, setProductOptions] = useState([]);
    const [factureImage, setFactureImage] = useState(null);



    useEffect(() => {
        const fetchTaxes = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/taxes', {
                    params: { createdBy: userId, isActive: true }
                });
                setTaxOptions(response.data.map(tax => ({
                    value: tax._id,
                    label: `${tax.name} - ${tax.value}%`
                })));
            } catch (error) {
                console.error("Error fetching taxes:", error);
            }
        };

        const fetchClients = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/client', {
                    params: { createdBy: userId }
                });
                setClientOptions(response.data.map(client => {
                    if (client.type === 'Person' && client.person) {
                        return {
                            value: client._id,
                            label: `${client.person.nom} ${client.person.prenom}`
                        };
                    } else if (client.type === 'Company' && client.entreprise) {
                        return {
                            value: client._id,
                            label: client.entreprise.nom
                        };
                    } else {
                        return {
                            value: client._id,
                            label: `Unknown Client`
                        };
                    }
                }));
            } catch (error) {
                console.error("Error fetching clients:", error);
            }
        };

        const fetchCurrencies = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/currency', {
                    params: { createdBy: userId }
                });
                setCurrencyOptions(response.data.map(currency => ({
                    value: currency._id,
                    label: `${currency.code} - ${currency.name}`
                })));
            } catch (error) {
                console.error("Error fetching currencies:", error);
            }
            console.log(invoiceData)
        };

        fetchClients();
        fetchCurrencies();

        fetchProducts();
        fetchTaxes();

    }, [userId]);

    useEffect(() => {
        if (invoiceData) {
            setInvoice(invoiceData);
            setSelectedTax(invoiceData.tax);
        }
    }, [invoiceData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInvoice({ ...invoice, [name]: value });
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...invoice.items];
        newItems[index] = { ...newItems[index], [name]: value };
        newItems[index].total = newItems[index].quantity * newItems[index].price;
        setInvoice({ ...invoice, items: newItems });
    };

    const addItem = () => {
        setInvoice({ ...invoice, items: [...invoice.items, { article: '', description: '', quantity: 1, price: 0, total: 0 }] });
    };

    const removeItem = (index) => {
        const newItems = invoice.items.filter((_, i) => i !== index);
        setInvoice({ ...invoice, items: newItems });
    };

    const calculateSubtotal = () => {
        return invoice.items.reduce((acc, item) => acc + item.total, 0);
    };

    const handleTaxChange = (e) => {
        const newTaxId = e.target.value;
        const selectedTaxOption = taxOptions.find(tax => tax.value === newTaxId);
        setSelectedTax(newTaxId);
        setInvoice(prevInvoice => ({
            ...prevInvoice,
            tax: selectedTaxOption // Update the tax in the invoice object
        }));
    };
    

    useEffect(() => {
        const subtotal = calculateSubtotal();
        const selectedTaxOption = taxOptions.find(tax => tax.value === selectedTax);
        const calculatedTax = selectedTaxOption ? (subtotal * parseFloat(selectedTaxOption.label.split(' - ')[1])) / 100 : 0;
        setTaxAmount(calculatedTax);
        setInvoiceTotal(subtotal + calculatedTax);
    }, [invoice.items, selectedTax, taxOptions]);

    const handleSave = async () => {
        try {
            // Log the invoice ID being sent
            console.log(`Invoice ID being sent: ${invoice._id}`);
    
            const formData = new FormData();
    
            // Append fields to FormData
            formData.append('client', invoice.client._id);
            console.log(invoice.client._id)
            formData.append('number', invoice.number);
            formData.append('year', invoice.year);
            formData.append('currency', invoice.currency._id);
            formData.append('status', invoice.status);
            formData.append('date', invoice.date);
            formData.append('note', invoice.note);
            formData.append('type', invoice.type);

    
            // Append items to FormData
            invoice.items.forEach((item, index) => {
                formData.append(`items[${index}][article]`, item.article);
                formData.append(`items[${index}][description]`, item.description);
                formData.append(`items[${index}][quantity]`, item.quantity);
                formData.append(`items[${index}][price]`, item.price);
                formData.append(`items[${index}][total]`, item.total);
            });
    
            formData.append('subtotal', calculateSubtotal());
    
            // Log selected tax
            console.log("Selected Tax:", selectedTax);
    
            if (selectedTax && selectedTax._id) {
                formData.append('tax', selectedTax._id); // Ensure tax ID is included
            } else {
                console.warn("No valid tax ID found, skipping tax append.");
            }
    
            formData.append('taxAmount', taxAmount);
            formData.append('total', invoiceTotal);
            formData.append('createdBy', userId);
    
            // Append the image file if it exists
            if (factureImage) {
                formData.append('factureImage', factureImage);
            }
    
            // Log FormData for debugging
            for (let pair of formData.entries()) {
                console.log(`${pair[0]}: ${pair[1]}`);
            }
    
            // Determine payment status
            let paymentStatus = invoice.paidAmount >= invoice.total ? 'Payé' : 'impayé';
    
            // Send the invoice data
            await axios.put(`http://localhost:5000/api/invoices/invoices/${invoice._id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
    
            // Update payment status if necessary
            if (paymentStatus === 'impayé') {
                await axios.put(`http://localhost:5000/api/invoices/invoices/${invoice._id}`, {
                    paymentStatus: paymentStatus
                }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
            }
    
            // Show success toast
            toast.success('Facture mise à jour avec succès', {
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
    
            refreshInvoices();
            toggle();
        } catch (error) {
            console.error("Error updating invoice:", error);
    
            if (error.response && error.response.status === 400) {
                toast.error('Le numéro de facture existe déjà. Veuillez utiliser un numéro unique.', {
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } else {
                toast.error('Erreur lors de la mise à jour de la facture. Veuillez réessayer plus tard.', {
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
        }
    };
    
   

    const handleProductChange = (index, selectedOption) => {
        const newItems = [...invoice.items];
        newItems[index] = {
            article: selectedOption.label, // Assuming you want the product name as the article
            description: selectedOption.description,
            quantity: 1, // Default quantity
            price: selectedOption.price,
            total: selectedOption.price // Set total based on price initially
        };
        setInvoice({ ...invoice, items: newItems });
    };
    const fetchProducts = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/product', {
                params: { createdBy: userId } // Adjust according to your API
            });
            setProductOptions(response.data.map(product => ({
                value: product._id,
                label: product.name, // Adjust to the property you want to show
                price: product.price, // Assuming price is a property
                description: product.description // Assuming description is a property
            })));
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };
    useEffect(() => {
        if (invoiceData) {
            setInvoice(invoiceData);

        }
        console.log(invoiceData)
    }, [invoiceData]);
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg">
            <ModalHeader toggle={toggle}>Modifier facture</ModalHeader>
            <h1>{invoiceData.tax.value}</h1>

            <ModalBody>
                <Row form>
                    <Col md={6}>
                        <FormGroup>
                            <Label for="client">Client</Label>
                            <Input
                                type="select"
                                name="client"
                                id="client"
                                value={invoice.client ? invoice.client._id : ''} // Use client ID here
                                onChange={(e) => {
                                    const selectedClient = clientOptions.find(option => option.value === e.target.value);
                                    handleInputChange({
                                        target: {
                                            name: 'client',
                                            value: selectedClient, // Set the selected client object
                                        },
                                    });
                                    console.log("Selected client ID:", selectedClient ? selectedClient.value : null); // Log the selected client ID
                                }}
                            >
                                <option value="">
                                    {invoice.client && invoice.client.type === 'Person'
                                        ? `${invoice.client.person.prenom} ${invoice.client.person.nom}`
                                        : invoice.client && invoice.client.entreprise.nom
                                            ? invoice.client.entreprise.nom // Adjust according to your data structure
                                            : 'Select a client'}
                                </option>

                                {clientOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Input>
                        </FormGroup>
                    </Col>



                    <Col md={3}>
                        <FormGroup>
                            <Label for="number">Number</Label>
                            <Input
                                type="number"
                                name="number"
                                id="number"
                                value={invoice.number}
                                onChange={handleInputChange}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={3}>
                        <FormGroup>
                            <Label for="year">Year</Label>
                            <Input
                                type="number"
                                name="year"
                                id="year"
                                value={invoice.year}
                                onChange={handleInputChange}
                            />
                        </FormGroup>
                    </Col>
                </Row>
                <Row form>
                    <Col md={6}>
                        <FormGroup>
                            <Label for="date">Date</Label>
                            <Input
                                type="date"
                                name="date"
                                id="date"
                                value={invoice.date || ''} // Use invoice.date or empty string if it's not set
                                onChange={handleInputChange}

                            />
                        </FormGroup>
                    </Col>

                    <Col md={6}>
                        <FormGroup>
                            <Label for="status">Status</Label>
                            <Input
                                type="select"
                                name="status"
                                id="status"
                                value={invoice.status}
                                onChange={handleInputChange}
                            >
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </Input>
                        </FormGroup>
                    </Col>
                </Row>
                <Row form>
                    <Col md={12}>
                        <FormGroup>
                            <Label for="currency">Currency</Label>
                            <Input
                                type="select"
                                name="currency"
                                id="currency"
                                value={invoice.currency}
                                onChange={handleInputChange}
                            >
                                <option value="">{invoice.currency.code} - {invoice.currency.name}</option>
                                {currencyOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Input>
                        </FormGroup>
                    </Col>

                </Row>
                <FormGroup>
                    <Label for="note">Note</Label>
                    <Input
                        type="textarea"
                        name="note"
                        id="note"
                        value={invoice.note}
                        onChange={handleInputChange}
                    />
                </FormGroup>
                <h5>Services</h5>
                {invoice.items.map((item, index) => (
                    <Row form key={index} className="align-items-center">
                        <Col md={5}>
                            <FormGroup>
                                <Label for={`product-${index}`}>Service</Label>
                                <Input
                                    type="select"
                                    name={`product-${index}`}
                                    id={`product-${index}`}
                                    onChange={(e) => handleProductChange(index, productOptions.find(option => option.value === e.target.value))}
                                >
                                    <option value="">{invoice.items[index].article}</option>
                                    {productOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label for={`quantity-${index}`}>Quantité</Label>
                                <Input
                                    type="number"
                                    name={`quantity-${index}`}
                                    id={`quantity-${index}`}
                                    value={item.quantity}
                                    onChange={(e) => {
                                        const newItems = [...invoice.items];
                                        newItems[index].quantity = e.target.value;
                                        newItems[index].total = newItems[index].quantity * newItems[index].price;
                                        setInvoice({ ...invoice, items: newItems });
                                    }}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={2}>
                            <FormGroup>
                                <Label for={`total-${index}`}>Total</Label>
                                <Input
                                    type="text"
                                    name={`total-${index}`}
                                    id={`total-${index}`}
                                    value={item.total}
                                    readOnly
                                />
                            </FormGroup>
                        </Col>
                        <Col md={2}>
                            <Button color="danger" onClick={() => removeItem(index)}>Supprimer</Button>
                        </Col>
                    </Row>
                ))}
                <Button color="primary" onClick={addItem}>Ajouter</Button>
                <Row form className="mt-3">
                    <Col md={6}>
                        <FormGroup>
                            <Label for="tax">Tax</Label>
                            <Input
                                type="select"
                                name="tax"
                                id="tax"
                                value={selectedTax ? selectedTax : ''} // Ensure selectedTax is correctly set
                                onChange={handleTaxChange}
                            >
                                <option value="">Select Tax</option>
                                {taxOptions.map((tax) => (
                                    <option key={tax.value} value={tax.value}>
                                        {tax.label}
                                    </option>
                                ))}
                            </Input>

                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <div>Subtotal: ${calculateSubtotal().toFixed(2)}</div>
                        <div>Tax: ${taxAmount.toFixed(2)}</div>
                        <div>Total: ${invoiceTotal.toFixed(2)}</div>
                    </Col>
                </Row>

            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle}>Annuler</Button>
                <Button color="primary" onClick={handleSave}>Modifer</Button>
            </ModalFooter>
        </Modal>
    );
};

export default EditInvoiceModal;