import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Button,
    Card,
    CardHeader,
    CardFooter,
    Input,
    Pagination,
    PaginationItem,
    PaginationLink,
    Table,
    Container,
    Row,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    DropdownToggle,
} from "reactstrap";
import Header from "components/Headers/ElementHeader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import Switch from 'react-switch';

import AddTaxModal from "./AddTaxModal ";
import DisplayTaxModal from "./DisplayTaxModal ";
import EditTaxModal from "./EditTaxModal ";

import ConfirmDeleteModal from "./ConfirmDeleteModal ";


const decodeToken = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload;
};

const Taxes = () => {
    const [taxes, setTaxes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [taxesPerPage] = useState(5);
    const [searchQuery, setSearchQuery] = useState("");
    const [buttonWidth, setButtonWidth] = useState('auto');
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [taxToDelete, setTaxToDelete] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [taxToEdit, setTaxToEdit] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [selectedTax, setSelectedTax] = useState(null);
    const [displayModalOpen, setDisplayModalOpen] = useState(false);

    const token = localStorage.getItem('token');
    const decodedToken = token ? decodeToken(token) : {};
    const currentUserId = decodedToken.AdminID;

    const fetchTaxes = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/taxes", { params: { createdBy: currentUserId } });
            setTaxes(response.data);
        } catch (error) {
            console.error("Error fetching taxes:", error);
        }
    };

    useEffect(() => {
        fetchTaxes();
    }, []);

    const refreshTaxes = () => {
        fetchTaxes();
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredTaxes = taxes.filter((tax) =>
        tax.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tax.value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 576) {
                setButtonWidth('100%');
            } else {
                setButtonWidth('auto');
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const indexOfLastTax = currentPage * taxesPerPage;
    const indexOfFirstTax = indexOfLastTax - taxesPerPage;
    const currentTaxes = filteredTaxes.slice(indexOfFirstTax, indexOfLastTax);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const toggleModal = () => {
        setModalOpen(!modalOpen);
    };

    const toggleDropdown = (id) => {
        setDropdownOpen(dropdownOpen === id ? null : id);
    };

    const toggleDeleteModal = () => {
        setDeleteModalOpen(!deleteModalOpen);
    };

    const handleDeleteClick = (id) => {
        setTaxToDelete(id);
        toggleDeleteModal();
    };

    const confirmDeleteTax = async () => {
        if (taxes.length === 1) {
            toast.error('Vous ne pouvez pas supprimer la seule taxe', {
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            toggleDeleteModal();
            return;
        }

        const taxToBeDeleted = taxes.find((tax) => tax._id === taxToDelete);

        if (taxToBeDeleted && taxToBeDeleted.isDefault) {
            toast.error('La taxe par défaut ne peut pas être supprimée', {
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            toggleDeleteModal();
            return;
        }

        try {
            await axios.delete(`http://localhost:5000/api/taxes/${taxToDelete}`);
            refreshTaxes();
            toggleDeleteModal();
            toast.success('Taxe supprimée avec succès', {
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (error) {
            console.error("Error deleting tax:", error);
        }
    };


    const toggleEditModal = () => {
        setEditModalOpen(!editModalOpen);
    };

    const handleEditClick = (tax) => {
        setSelectedTax(tax);
        setTaxToEdit(tax);
        toggleEditModal();
    };

    const toggleDisplayModal = () => {
        setDisplayModalOpen(!displayModalOpen);
    };

    const handleDisplayClick = (tax) => {
        setSelectedTax(tax);
        toggleDisplayModal();
    };

    return (
        <>
            <ToastContainer />
            <Header />
            <Container className="mt--7" fluid>
                <Row>
                    <div className="col">
                        <Card className="shadow">
                            <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                                <h3 className="mb-0">Listes des taxes</h3>
                                <div className="d-flex">
                                    <Input
                                        type="text"
                                        placeholder="Search"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="mr-3"
                                    />
                                    <Button color="primary" style={{ width: buttonWidth }} onClick={toggleModal}>Ajouter taxe</Button>
                                </div>
                            </CardHeader>
                            <div className="table-wrapper">
                                <Table className="align-items-center table-flush" >
                                    <thead className="thead-light">
                                        <tr>
                                            <th scope="col">Nom</th>
                                            <th scope="col">Valeur</th>
                                            <th scope="col">Active</th>
                                            <th scope="col">par défaut</th>
                                            <th scope="col"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentTaxes.length > 0 ? (
                                            currentTaxes.map((tax) => (
                                                <tr key={tax._id}>
                                                    <td>{tax.name}</td>
                                                    <td>{tax.taxvalue}%</td>
                                                    <td><Switch
                                                        checked={tax.isActive}
                                                        onChange={() => { }}
                                                        onColor="#86d3ff"
                                                        offColor="#888"
                                                        onHandleColor="#002395"
                                                        offHandleColor="#d4d4d4"
                                                        handleDiameter={15}
                                                        uncheckedIcon={false}
                                                        checkedIcon={false}
                                                        height={10}
                                                        width={30}
                                                        className="react-switch"
                                                    /></td>
                                                    <td><Switch
                                                        checked={tax.isDefault}
                                                        onChange={() => { }}
                                                        onColor="#86d3ff"
                                                        offColor="#888"
                                                        onHandleColor="#002395"
                                                        offHandleColor="#d4d4d4"
                                                        handleDiameter={15}
                                                        uncheckedIcon={false}
                                                        checkedIcon={false}
                                                        height={10}
                                                        width={30}
                                                        className="react-switch"
                                                    /></td>

                                                    <td>
                                                        <Dropdown isOpen={dropdownOpen === tax._id} toggle={() => toggleDropdown(tax._id)}>
                                                            <DropdownToggle tag="span" data-toggle="dropdown" style={{ cursor: 'pointer' }}>
                                                                <FontAwesomeIcon icon={faEllipsisH} style={{ fontSize: '1rem' }} />
                                                            </DropdownToggle>
                                                            <DropdownMenu right style={{ marginTop: "-25px" }}>
                                                                <DropdownItem onClick={() => handleDisplayClick(tax)}>
                                                                    <span className="d-flex align-items-center">
                                                                        <i className="fa-solid fa-eye" style={{ fontSize: '1rem', marginRight: '10px' }}></i>
                                                                        Afficher
                                                                    </span>
                                                                </DropdownItem>
                                                                <DropdownItem onClick={() => handleEditClick(tax)}>
                                                                    <span className="d-flex align-items-center">
                                                                        <i className="fa-solid fa-gear" style={{ fontSize: '1rem', marginRight: '10px' }}></i>
                                                                        Modifier
                                                                    </span>
                                                                </DropdownItem>
                                                                <DropdownItem divider />
                                                                <DropdownItem onClick={() => handleDeleteClick(tax._id)}>
                                                                    <span className="d-flex align-items-center">
                                                                        <i className="fa-solid fa-trash text-danger" style={{ fontSize: '1rem', marginRight: '10px' }}></i>
                                                                        <span className="text-danger">Supprimer</span>
                                                                    </span>
                                                                </DropdownItem>
                                                            </DropdownMenu>
                                                        </Dropdown>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4">
                                                    <div style={{ textAlign: 'center' }}>
                                                        <i className="fa-solid fa-ban" style={{ display: 'block', marginBottom: '10px', fontSize: '50px', opacity: '0.5' }}></i>
                                                        <span className="text-danger">Aucun enregistrement correspondant n'a été trouvé</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                            <CardFooter className="py-4">
                                <nav aria-label="...">
                                    <Pagination
                                        className="pagination justify-content-end mb-0"
                                        listClassName="justify-content-end mb-0"
                                    >
                                        {Array.from({ length: Math.ceil(filteredTaxes.length / taxesPerPage) }).map((_, index) => (
                                            <PaginationItem key={index} active={index + 1 === currentPage}>
                                                <PaginationLink onClick={() => paginate(index + 1)}>{index + 1}</PaginationLink>
                                            </PaginationItem>
                                        ))}
                                    </Pagination>
                                </nav>
                            </CardFooter>
                        </Card>
                    </div>
                </Row>
            </Container>

            <AddTaxModal
                isOpen={modalOpen}
                toggle={toggleModal}
                refreshTaxes={refreshTaxes}
                userId={currentUserId}
            />



            {displayModalOpen && (
                <DisplayTaxModal
                    isOpen={displayModalOpen}
                    toggle={toggleDisplayModal}
                    tax={selectedTax}
                />
            )}

            {editModalOpen &&
                <EditTaxModal
                    isOpen={editModalOpen}
                    toggle={toggleEditModal}
                    tax={taxToEdit}
                    refreshTaxes={refreshTaxes}
                />
            }

            <ConfirmDeleteModal
                isOpen={deleteModalOpen}
                toggle={toggleDeleteModal}
                onConfirm={confirmDeleteTax}
            />
        </>
    );
};

export default Taxes;
