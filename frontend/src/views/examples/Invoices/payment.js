import React, { useState, useEffect } from 'react';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, FormGroup, Label, Input, Col, Row
} from 'reactstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const EnregistrerPaymentModal = ({ isOpen, toggle, invoice, refreshInvoices, userId }) => {
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
    const [paymentMethod, setPaymentMethod] = useState('');

    const remainingAmount = invoice.total - invoice.paidAmount;

    useEffect(() => {
        if (invoice) {
            setAmount('');
            setPaymentDate(new Date().toISOString().split("T")[0]);
            setPaymentMethod('');
        }
    }, [invoice, isOpen]);

    const handleEnregistrer = async () => {
        const amountValue = parseFloat(amount);

        if (isNaN(amountValue) || amountValue <= 0) {
            toast.error('Veuillez saisir un montant de paiement valide.');
            return;
        }

        if (amountValue > remainingAmount) {
            toast.error('Le montant du paiement dépasse le montant restant à payer.');
            return;
        }

        if (invoice.paymentStatus === 'Payé') {
            toast.warning('Cette facture a déjà été payée.');
            return;
        }

        // Check if payment is made after the expiration date
        const expirationDate = new Date(invoice.expirationDate);
        const selectedPaymentDate = new Date(paymentDate);

        

        // Enregistrer the payment
        try {
            await axios.post(`http://localhost:5000/api/payments/invoice/${invoice._id}`, {
                amountPaid: amountValue,
                paymentDate,
                paymentMethod,
                createdBy: userId
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            toast.success('Paiement enregistré avec succès');
            refreshInvoices();
            toggle();
        } catch (error) {
            console.error("Error saving payment:", error.response?.data || error.message);
            toast.error("Échec de l'enregistrement du paiement");
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg">
            <ModalHeader toggle={toggle}>
            Enregistrer le paiement de la facture # {invoice.number}
                <span className={`badge badge-${invoice.paymentStatus === 'Payé' ? 'success' : invoice.paymentStatus === 'Partiellement payé' ? 'info' : 'danger'} ml-2`}>
                    {invoice.paymentStatus}
                </span>
            </ModalHeader>
            <ModalBody>
                <Row>
                    <Col md="6">
                        <FormGroup>
                            <Label for="amount">Montant</Label>
                            <Input
                                type="number"
                                name="amount"
                                id="amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="paymentDate">Date de paiement</Label>
                            <Input
                                type="date"
                                name="paymentDate"
                                id="paymentDate"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                required
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="paymentMethod">Méthode de paiement</Label>
                            <Input
                                type="select"
                                name="paymentMethod"
                                id="paymentMethod"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                required
                            >
                                <option value="">Selectionnez méthode</option>
                                <option value="Virement bancaire">Virement bancaire</option>
                                <option value="Espèces">Espèces</option>
                                <option value="Autres">Autres</option>
                            </Input>
                        </FormGroup>
                    </Col>
                    <Col md="6">
                        <div className="client-details">
                            <h6>Client:  {invoice.client.type === 'Person'
                            ? `${invoice.client.person.nom} ${invoice.client.person.prenom}`
                            : `${invoice.client.entreprise.nom}`}</h6>
                            <p>Email:  {invoice.client.type === 'Person'
                            ? `${invoice.client.person.email} `
                            : `${invoice.client.entreprise.email}`}</p>
                            <p>Téléphone:  {invoice.client.type === 'Person'
                            ? `${invoice.client.person.telephone} `
                            : `${invoice.client.entreprise.telephone}`}</p>
                            <p>Status de paiement: <span className={`badge badge-${invoice.paymentStatus === 'Payé' ? 'success' : invoice.paymentStatus === 'Partiellement payé' ? 'info' : 'danger'}`}>{invoice.paymentStatus}</span></p>
                            <hr />
                            <p>Subtotal: {invoice.subtotal} </p>
                            <p>Total: {invoice.total} </p>
                            <p>Payé: {invoice.paidAmount} </p>
                            <p>Montant restant: {remainingAmount} </p>
                        </div>
                    </Col>
                </Row>
            </ModalBody>
            <ModalFooter>
                <Button color="primary" onClick={handleEnregistrer}>Enregistrer Payment</Button>
                <Button color="secondary" onClick={toggle}>Annuler</Button>
            </ModalFooter>
        </Modal>
    );
};

export default EnregistrerPaymentModal;
