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

const EditProformaInvoiceModal = ({ isOpen, toggle, invoiceData, refreshInvoices, userId }) => {
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
                    label: `${tax.taxvalue}%`
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
            setSelectedCurrency(invoiceData.currency)
        }
    }, [invoiceData],);

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
        console.log('New tax ID:', newTaxId);

        // Find the selected tax option (the full object)
        const selectedTaxOption = taxOptions.find(tax => tax.value === newTaxId);
        console.log('Selected tax option:', selectedTaxOption);

        // Update the selected tax with the full tax object, not just the ID
        setSelectedTax(selectedTaxOption);

        // Update the invoice object with the new tax
        setInvoice(prevInvoice => ({
            ...prevInvoice,
            tax: selectedTaxOption // Update the tax in the invoice object
        }));
    };
    const handleCurrencyChange = (e) => {
        const newCurrencyId = e.target.value;
        console.log('New currency ID:', newCurrencyId);

        // Find the selected currency option (the full object)
        const selectedCurrencyOption = currencyOptions.find(currency => currency.value === newCurrencyId);
        console.log('Selected currency option:', selectedCurrencyOption);

        // Update the selected currency with the full currency object, not just the ID
        setSelectedCurrency(selectedCurrencyOption);

        // Update the invoice object with the new currency
        setInvoice(prevInvoice => ({
            ...prevInvoice,
            currency: selectedCurrencyOption // Update the currency in the invoice object
        }));
    };
    const handleClientChange = (e) => {
        const newClientId = e.target.value;
        console.log('New client ID:', newClientId);

        // Find the selected client option (the full object)
        const selectedClientOption = clientOptions.find(client => client.value === newClientId);
        console.log('Selected client option:', selectedClientOption);

        // Update the selected client with the full client object, not just the ID
        setSelectedClient(selectedClientOption);

        // Update the invoice object with the new client
        setInvoice(prevInvoice => ({
            ...prevInvoice,
            client: selectedClientOption // Update the client in the invoice object
        }));
    };


    // Optional: Log the updated state of selectedTax after the state change
    useEffect(() => {
        console.log("Updated selectedTax state:", selectedTax);
    }, [selectedTax]);

    useEffect(() => {
        console.log("Updated selectedcurrency state:", selectedCurrency);
    }, [selectedCurrency]);

    useEffect(() => {
        console.log("Updated selectedClient state:", selectedClient);
    }, [selectedClient]);


    useEffect(() => {
        const subtotal = calculateSubtotal();

        const selectedTaxOption = taxOptions.find(tax => tax.value === getTaxevaluecalcule(selectedTax.value));
        const calculatedTax = selectedTaxOption ? (subtotal * parseFloat(selectedTaxOption.label)) / 100 : 0;
        setTaxAmount(calculatedTax);
        setInvoiceTotal(subtotal + calculatedTax);
    }, [invoice.items, selectedTax, taxOptions,selectedCurrency,currencyOptions,selectedClient,clientOptions]);

    const handleSave = async () => {
        try {
            // Log the invoice ID being sent
            console.log(`Invoice ID being sent: ${invoice._id}`);

            const formData = new FormData();

            // Append fields to FormData
            formData.append('number', invoice.number);
            formData.append('year', invoice.year);
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

            // Append subtotal and tax
            formData.append('subtotal', calculateSubtotal());

            // Log and append selected tax
            console.log("Selected Tax:", selectedTax);

            // Check if the selectedTax is valid and append its ID
            if (selectedTax && selectedTax.value) {
                formData.append('tax', selectedTax.value); // Ensure tax ID is included
            } else {
                console.warn("No valid tax ID found, skipping tax append.");
            }

            if (selectedCurrency && selectedCurrency.value) {
                formData.append('currency', selectedCurrency.value); // Ensure tax ID is included
            } else {
                console.warn("No valid tax ID found, skipping tax append.");
            }

            if (selectedClient && selectedClient.value) {
                formData.append('client', selectedClient.value); // Ensure tax ID is included
            } else {
                console.warn("No valid tax ID found, skipping tax append.");
            }

            // Append tax amount and total
            formData.append('taxAmount', taxAmount); // Ensure this value is calculated correctly
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

            // Refresh the list of invoices and close the modal
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
    }, [invoiceData]);


    const getTaxevalue = (id) => {
        const maincontact = taxOptions.find(taxe => taxe.value === id);
        return maincontact ? maincontact.label : selectedTax.taxvalue;
    };

    const getCurrencyCode = (id) => {
        const maincontact = currencyOptions.find(curr => curr.value === id);
        return maincontact ? maincontact.label : selectedCurrency.code +" - "+ selectedCurrency.name ;
    };

    const getClientName = (id) => {
        const maincontact = clientOptions.find(client => client.value === id);
        return maincontact ? maincontact.label : selectedClient?.type ==="Person" ? selectedClient?.person?.nom : selectedClient?.entreprise?.nom  ;
    };

    const getTaxevaluecalcule = (id) => {
        const maincontact = taxOptions.find(taxe => taxe.value === id);
        return maincontact ? maincontact.value : selectedTax._id ;
    };
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg">
            <ModalHeader toggle={toggle}>Modifier facture</ModalHeader>

            <ModalBody>
                <Row form>
                    <Col md={6}>
                        <FormGroup>
                            <Label for="client">Client</Label>
                            <Input
                                type="select"
                                name="client"
                                id="client"
                                value={selectedClient ? selectedClient : ' '} // Use client ID here
                                onChange={handleClientChange}
                            >
                                {console.log("newwww", selectedClient.label)}

                                <option value="">
                                   {getClientName(selectedClient.value)}
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
                                value={selectedCurrency ? selectedCurrency : ''}
                                onChange={handleCurrencyChange}
                            >

                                <option value="">{getCurrencyCode(selectedCurrency.value)}</option>
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

                                <option value="">{getTaxevalue(selectedTax.value)}%</option>
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
                        <div>Subtotal: {calculateSubtotal().toFixed(2)}</div>
                        <div>Tax:{taxAmount.toFixed(2)}</div>
                        <div>Total: {invoiceTotal.toFixed(2)}</div>
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

export default EditProformaInvoiceModal;