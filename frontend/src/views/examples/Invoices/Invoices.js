import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Button,
    Card,
    CardHeader,
    Input,
    Table,
    Container,
    Row,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    DropdownToggle,
    Pagination,
    PaginationItem,
    PaginationLink,
    CardFooter,
    Badge,
    Col,
} from "reactstrap";
import Header from "components/Headers/ElementHeader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import DisplayInvoiceModal from "../Invoices/DisplayInvoicemodal";
import AddInvoiceModal from "../Invoices/AddInvoiceModal";
import EditInvoiceModal from "./EditInvoiceModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import PaymentModal from "./payment";


const decodeToken = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload;
};

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState([]);
    const [clients, setClients] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [invoicesPerPage] = useState(5);
    const [searchQuery, setSearchQuery] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [displayModalOpen, setDisplayModalOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [invoiceToEdit, setInvoiceToEdit] = useState(null);
    const [taxe, setTaxe] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [invoiceToPay, setInvoiceToPay] = useState(null);
    const [selectedType, setSelectedType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [totalPaid, setTotalPaid] = useState(0);
    const [totalUnPaid, setTotalUnPaid] = useState(0);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);








    const token = localStorage.getItem('token');
    const decodedToken = token ? decodeToken(token) : {};
    const currentUserId = decodedToken.AdminID;
    const username = decodedToken.name;
    const userlastname = decodedToken.surname;

    const calculateTotalPaid = (invoices) => {
        return invoices
            .filter(invoice => invoice.paymentStatus === "Payé" && invoice.type === "Standard")
            .reduce((sum, invoice) => sum + invoice.total, 0);
    };

    const calculateTotalUnPaid = (invoices) => {
        return invoices
            .filter(invoice => invoice.paymentStatus === "impayé" && invoice.type === "Standard")
            .reduce((sum, invoice) => sum + invoice.total, 0);
    };

    const fetchInvoices = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/invoices/${currentUserId}`, {
                params: {
                    type: selectedType || undefined,
                    status: selectedStatus || undefined,
                }
            });

            const filteredInvoices = response.data.filter(invoice => {
                const invoiceDate = new Date(invoice.date);
                const start = new Date(startDate);
                const end = new Date(endDate);


                const currencyMatches = invoice?.currency?._id === selectedCurrency?._id;
                const dateInRange =
                    (!startDate && !endDate) || // If no dates are selected, include all invoices
                    (invoiceDate >= start && invoiceDate <= end); // Date range check

                return currencyMatches && dateInRange;
            });
            const sortedInvoices = filteredInvoices.sort((a, b) => new Date(b.date) - new Date(a.date));
            setInvoices(sortedInvoices);
            setTotalPaid(calculateTotalPaid(filteredInvoices));
            setTotalUnPaid(calculateTotalUnPaid(filteredInvoices));


            console.log(filteredInvoices);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        }
    };


    const refreshInvoices = () => {
        fetchInvoices();
    };

    const fetchClients = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/client', {
                params: { createdBy: currentUserId }
            });
            setClients(response.data);
            console.log(response.data);
        } catch (err) {
            toast.error('Impossible de récupérer les clients');
        }
    };

    const fetchTaxes = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/taxes", { params: { createdBy: currentUserId } });
            setTaxe(response.data);
        } catch (error) {
            console.error("Error fetching taxes:", error);
        }
    };

    const fetchCurrencies = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/currency", {
                params: { createdBy: currentUserId },

            });
            setCurrencies(response.data);
        } catch (error) {
            console.error("Error fetching currencies:", error);
        }
    };


    const getClientNameById = (clientId) => {
        const client = clients.find(client => client._id === clientId);
        if (!client) return 'Client non trouvé';

        if (client.type === 'Person' && client.person) {
            return (
                <>
                    {client.person.prenom} <br /> {client.person.nom}
                </>
            );
        } else if (client.type === 'Company' && client.entreprise) {
            return client.entreprise.nom;
        } else {
            return 'Type de client non reconnu';
        }
    };


    useEffect(() => {
        fetchInvoices();
        fetchClients();
        fetchTaxes();
        fetchCurrencies();
    }, [selectedCurrency, startDate, endDate, selectedType, selectedStatus]);

    useEffect(() => {
        setTotalPaid(calculateTotalPaid(invoices));
    }, [invoices]);
    useEffect(() => {
        setTotalUnPaid(calculateTotalUnPaid(invoices));
    }, [invoices]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleDeleteClick = (id) => {
        setInvoiceToDelete(id);
        toggleDeleteModal();
    };

    const confirmDeleteInvoice = async () => {
        try {
            await axios.delete(`http://localhost:5000/api/invoices/${invoiceToDelete}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            refreshInvoices();
            toggleDeleteModal();
            toast.success('Invoice deleted successfully', {
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (error) {
            console.error("Error deleting invoice:", error);
        }
    };

    const filteredInvoices = invoices.filter((invoice) => {
        const isPersonClient = invoice?.client?.type === 'Person'; // Check if the client type is 'Person'
        const isCompanyClient = invoice?.client?.type === 'Company'; // Check if the client type is 'Company'

        return (
            invoice?.type === 'Standard' && // Ensure invoice type is 'Standard'
            (
                (isPersonClient && invoice?.client?.person.prenom?.toLowerCase().startsWith(searchQuery.toLowerCase())) || // For Person type, check if name starts with search query
                (isPersonClient && invoice?.client?.person.nom?.toLowerCase().startsWith(searchQuery.toLowerCase())) || // For Person type, check if name starts with search query

                (isCompanyClient && invoice?.client?.name?.toLowerCase().startsWith(searchQuery.toLowerCase())) || // For Company type, check if name starts with search query
                invoice?.number?.toString().startsWith(searchQuery) // Check if invoice number starts with the search query
            )
        );
    });




    const indexOfLastInvoice = currentPage * invoicesPerPage;
    const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
    const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const toggleDropdown = (id) => {
        setDropdownOpen(dropdownOpen === id ? null : id);
    };

    const toggleDisplayModal = () => {
        setDisplayModalOpen(!displayModalOpen);
    };

    const handleDisplayClick = (invoice) => {
        setSelectedInvoice(invoice);
        toggleDisplayModal();
    };

    const toggleModal = () => {
        setModalOpen(!modalOpen);
    };

    const toggleDeleteModal = () => {
        setDeleteModalOpen(!deleteModalOpen);
    };

    const toggleEditModal = () => {
        setEditModalOpen(!editModalOpen);
    };

    const handleEditClick = (invoice) => {
        setSelectedInvoice(invoice);
        setInvoiceToEdit(invoice);
        toggleEditModal();
    };

    const togglePaymentModal = () => {
        setPaymentModalOpen(!paymentModalOpen);
    };

    const handleSavePaymentClick = (invoice) => {
        setInvoiceToPay(invoice);
        togglePaymentModal();
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Envoyé':
                return 'success';
            case 'Annulé':
                return 'danger';
            case 'Brouillon':
                return 'light';

            case 'Cancelled':
                return 'danger';
            default:
                return 'light';
        }
    };

    const getPaymentStatusStyle = (status) => {
        switch (status) {
            case 'Payé':
                return 'success';
            case 'impayé':
                return 'danger';
            case 'Partiellement payé':
                return 'info';
            case 'Retard':
                return 'warning';
            default:
                return 'light';
        }
    };
    const getCurrencySymbolById = (id, price) => {
        const currency = currencies.find(currency => currency._id === id);

        if (!currency) {
            return 'Devise non trouvée';
        }


        else {
            return currency.symbol;
        }
    };

    const handleCheckboxChange = (invoiceId) => {
        setSelectedInvoices((prevSelected) => {
            // Check if the selected invoice exists in the previously selected invoices
            const isSelected = prevSelected.some(invoice => invoice._id === invoiceId);

            if (isSelected) {
                // Deselect: filter out the selected invoice
                return prevSelected.filter(invoice => invoice._id !== invoiceId);
            } else {
                // Select: find the invoice object and add it to selectedInvoices
                const selectedInvoice = invoices.find(invoice => invoice._id === invoiceId);
                return [...prevSelected, selectedInvoice]; // Add the entire invoice object
            }
        });
    };

    const handleGenerateZip = async () => {
        // Log selected invoices before processing
        console.log('Selected Invoices:', selectedInvoices);

        // Ensure there are selected invoices
        if (selectedInvoices.length === 0) {
            console.error('No invoices selected');
            return; // Exit the function
        }

        // Map to get the IDs and join them
        const invoiceIds = selectedInvoices
            .map(invoice => invoice._id)
            .filter(id => id) // Ensure only valid IDs are included
            .join(',');

        // Log the generated invoiceIds
        console.log('Generated invoiceIds:', invoiceIds);

        // Ensure invoiceIds is not empty
        if (!invoiceIds) {
            console.error('No valid invoice IDs found');
            return; // Exit the function
        }

        // Ensure createdBy is defined
        const createdBy = currentUserId; // Replace with the actual user ID
        if (!createdBy) {
            console.error('CreatedBy is required');
            return; // Exit the function
        }

        try {
            const response = await axios.get(`http://localhost:5000/api/invoices/export-multi/pdf?invoiceIds=${invoiceIds}&createdBy=${createdBy}`, {
                responseType: 'blob', // Important to specify that the response will be a blob
            });

            // Create a URL for the blob response
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Create a link element
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'invoices.zip'); // Set the file name

            // Append to the body and trigger the download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating ZIP file:', error);
            // You can add error handling here, like showing a toast notification
        }
    };



    const handleSelectAllChange = (e) => {
        if (e.target.checked) {
            setSelectedInvoices(filteredInvoices); // Select all filtered invoices
        } else {
            setSelectedInvoices([]); // Deselect all invoices
        }
    };

    const handleCurrencySelect = (currency) => {
        setSelectedCurrency(currency);
    };
    const toggleCurrencyDropdown = () => setCurrencyDropdownOpen(!currencyDropdownOpen);

    return (
        <>
            <ToastContainer />
            <Header />

            <Container className="mt--7" fluid >
                <Row className="mb-4">
                    <Col lg="12" className="mb-4 d-flex justify-content-end">
                        <Dropdown
                            isOpen={currencyDropdownOpen}
                            toggle={toggleCurrencyDropdown}
                        >
                            <DropdownToggle caret>
                                {selectedCurrency ? selectedCurrency.name : "Select Devise"}
                            </DropdownToggle>
                            <DropdownMenu>
                                {currencies.map(currency => (
                                    <DropdownItem key={currency._id} onClick={() => handleCurrencySelect(currency)}>
                                        {currency.name}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                    </Col>
                </Row>
                <Row>
                    <div className="col">
                        <Card className="shadow" >
                            <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                                <h3 className="mb-0">Liste des factures Ventes</h3>
                                <div className="d-flex">
                                    {/* Non-clickable buttons */}
                                    <Button color="success" className="ml-2" disabled>
                                        Total Payé: {totalPaid.toFixed(3)} {/* Display the sum here */}
                                    </Button>

                                    <Button color="danger" className="ml-2" disabled>
                                        Total Impayé: {totalUnPaid.toFixed(3)}
                                    </Button>
                                </div>
                                <div className="d-flex align-items-center">
                                    {/* Date Filter */}
                                    <Input
                                        type="date"
                                        placeholder="Date Début"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="mr-3"
                                    />
                                    <Input
                                        type="date"
                                        placeholder="Date Fin"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="mr-3"
                                    />
                                    {/* Search Input */}
                                    <Input
                                        type="text"
                                        placeholder="Search"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="mr-3"
                                    />
                                    {/* Add Invoice Button */}
                                    <Button color="primary" onClick={toggleModal}>Ajouter facture</Button>

                                    {selectedInvoices.length > 1 && (
                                        <Button color="warning" className="ml-2" onClick={handleGenerateZip}>
                                            Télécharger
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>


                            <div className="table-wrapper">
                                <Table className="align-items-center table-flush">
                                    <thead className="thead-light">
                                        <tr>
                                            <th scope="col"><div className="select-all-container" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                                <input
                                                    type="checkbox"
                                                    onChange={handleSelectAllChange}
                                                    checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                                                />
                                            </div></th>
                                            <th scope="col">Numéro de facture</th>
                                            <th scope="col">Client</th>
                                            <th scope="col">Date</th>
                                            <th scope="col">Total</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">paiement</th>
                                            <th scope="col"></th>
                                            <th scope="col"></th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentInvoices.length > 0 ? (
                                            currentInvoices.map((invoice) => (
                                                <tr key={invoice._id}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            onChange={() => handleCheckboxChange(invoice._id)}
                                                            checked={selectedInvoices.some(selected => selected._id === invoice._id)} // Check if the full invoice object is selected
                                                        />
                                                    </td>
                                                    <td>{invoice.number}</td>
                                                    <td>{getClientNameById(invoice.client._id)}</td>
                                                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                                                    <td>{invoice.total}</td>
                                                    <td>
                                                        <Badge color={getStatusStyle(invoice.status)}>
                                                            {invoice.status}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Badge color={getPaymentStatusStyle(invoice.paymentStatus)}>
                                                            {invoice.paymentStatus}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Dropdown isOpen={dropdownOpen === invoice._id} toggle={() => toggleDropdown(invoice._id)}>
                                                            <DropdownToggle tag="span" data-toggle="dropdown" style={{ cursor: 'pointer' }}>
                                                                <FontAwesomeIcon icon={faEllipsisH} style={{ fontSize: '1rem' }} />
                                                            </DropdownToggle>
                                                            <DropdownMenu right style={{ marginTop: "-25px" }}>
                                                                <DropdownItem onClick={() => { handleDisplayClick(invoice) }}>
                                                                    <span className="d-flex align-items-center">
                                                                        <i className="fa-solid fa-eye" style={{ fontSize: '1rem', marginRight: '10px' }}></i>
                                                                        Afficher
                                                                    </span>
                                                                </DropdownItem>
                                                                <DropdownItem onClick={() => handleEditClick(invoice)}>
                                                                    <span className="d-flex align-items-center">
                                                                        <i className="fa-solid fa-gear" style={{ fontSize: '1rem', marginRight: '10px' }}></i>
                                                                        Modifier
                                                                    </span>
                                                                </DropdownItem>
                                                                <DropdownItem onClick={() => handleSavePaymentClick(invoice)}>
                                                                    <span className="d-flex align-items-center">
                                                                        <i className="fa-solid fa-dollar-sign" style={{ fontSize: '1rem', marginRight: '10px' }}></i>
                                                                        Enregister paiement
                                                                    </span>
                                                                </DropdownItem>
                                                                <DropdownItem divider />
                                                                <DropdownItem onClick={() => handleDeleteClick(invoice._id)}>
                                                                    <span className="d-flex align-items-center">
                                                                        <i className="fa-solid fa-trash text-danger" style={{ fontSize: '1rem', marginRight: '10px' }}></i>
                                                                        Supprimer
                                                                    </span>
                                                                </DropdownItem>
                                                            </DropdownMenu>
                                                        </Dropdown>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8">
                                                    <div style={{ textAlign: 'center' }}>
                                                        <i className="fa-solid fa-ban" style={{ display: 'block', marginBottom: '10px', fontSize: '50px', opacity: '0.5' }}></i>
                                                        Aucune facture trouvée
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>

                            </div>
                            <CardFooter className="py-4">
                                <nav aria-label="...">
                                    <Pagination className="pagination justify-content-end mb-0">
                                        {[...Array(Math.ceil(filteredInvoices.length / invoicesPerPage)).keys()].map((pageNumber) => (
                                            <PaginationItem key={pageNumber + 1} active={currentPage === pageNumber + 1}>
                                                <PaginationLink onClick={() => paginate(pageNumber + 1)}>
                                                    {pageNumber + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                    </Pagination>
                                </nav>
                            </CardFooter>
                        </Card>
                    </div>
                </Row>
            </Container>
            <AddInvoiceModal
                isOpen={modalOpen}
                toggle={toggleModal}
                refreshInvoices={fetchInvoices}
                userId={currentUserId}
            />
            <ConfirmDeleteModal
                isOpen={deleteModalOpen}
                toggle={toggleDeleteModal}
                onConfirm={confirmDeleteInvoice}
            />
            {displayModalOpen && (
                <DisplayInvoiceModal
                    isOpen={displayModalOpen}
                    toggle={toggleDisplayModal}
                    invoice={selectedInvoice}
                    clients={clients}
                    taxe={taxe}
                    currency={currencies}
                    refreshInvoices={refreshInvoices}

                />
            )}
            {editModalOpen && (
                <EditInvoiceModal
                    isOpen={editModalOpen}
                    toggle={toggleEditModal}
                    invoiceData={invoiceToEdit}
                    refreshInvoices={refreshInvoices}
                    userId={currentUserId}
                    PaidAmount
                />
            )}
            {paymentModalOpen && (
                <PaymentModal
                    isOpen={paymentModalOpen}
                    toggle={togglePaymentModal}
                    invoice={invoiceToPay}
                    refreshInvoices={refreshInvoices}
                    clients={clients}
                    userId={currentUserId}



                />
            )}

        </>
    );
};

export default Invoices;
