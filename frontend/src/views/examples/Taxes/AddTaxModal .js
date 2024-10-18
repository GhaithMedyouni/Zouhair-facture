import React, { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, FormGroup, Label } from "reactstrap";
import Switch from 'react-switch'; 
import axios from "axios";
import { toast } from 'react-toastify';

const AddTaxModal = ({ isOpen, toggle, refreshTaxes, userId }) => {
    const [name, setName] = useState("");
    const [taxvalue, setTaxValue] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isDefault, setIsDefault] = useState(false);

    const handleSubmit = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/taxes");
            const existingTaxes = response.data;

            if (isDefault) {
                const currentDefaultTax = existingTaxes.find(tax => tax.isDefault);

                if (currentDefaultTax) {
                    await axios.put(`http://localhost:5000/api/taxes/${currentDefaultTax._id}`, {
                        ...currentDefaultTax,
                        isDefault: false
                    });
                }
            }

            await axios.post("http://localhost:5000/api/taxes", {
                name,
                taxvalue,
                isActive,
                isDefault,
                createdBy: userId,
            });

            toast.success('Taxe ajoutée avec succès', {
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            refreshTaxes();
            toggle();
        } catch (error) {
            console.error("Error adding tax:", error);
            toast.error("Erreur lors de l'ajout de la taxe", {
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle}>
            <ModalHeader toggle={toggle}>Ajouter tax</ModalHeader>
            <ModalBody>
                <FormGroup>
                    <Label for="name">Nom</Label>
                    <Input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </FormGroup>
                <FormGroup>
                    <Label for="value">Valeur (%)</Label>
                    <Input
                        type="number"
                        id="value"
                        value={taxvalue}
                        onChange={(e) => setTaxValue(e.target.value)}
                    />
                </FormGroup>
                <FormGroup>
                    <Label for="isActive">Active</Label>
                    <Switch
                        checked={isActive}
                        onChange={() => setIsActive(!isActive)}
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
                    />
                </FormGroup>
                <FormGroup>
                    <Label for="isDefault">Par défaut</Label>
                    <Switch
                        checked={isDefault}
                        onChange={() => setIsDefault(!isDefault)}
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
                    />
                </FormGroup>
            </ModalBody>
            <ModalFooter>
                <Button color="primary" onClick={handleSubmit}>Ajouter</Button>
                <Button color="secondary" onClick={toggle}>Annuler</Button>
            </ModalFooter>
        </Modal>
    );
};

export default AddTaxModal;
