from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Or restrict it to your specific S3 URL

# Configure the database using the DATABASE_URL environment variable
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Contact model
class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(100))

# Fetch all contacts
@app.route('/contacts', methods=['GET'])
def get_contacts():
    contacts = Contact.query.all()
    return jsonify([{
        'id': contact.id,
        'name': contact.name,
        'phone': contact.phone,
        'email': contact.email
    } for contact in contacts])

# Add a new contact
@app.route('/contacts', methods=['POST'])
def add_contact():
    data = request.get_json()
    new_contact = Contact(name=data['name'], phone=data['phone'], email=data['email'])
    db.session.add(new_contact)
    db.session.commit()
    return jsonify({'message': 'Contact added successfully'}), 201

# Edit a contact
@app.route('/contacts/<int:contact_id>', methods=['PUT'])
def update_contact(contact_id):
    data = request.get_json()
    contact = Contact.query.get(contact_id)
    
    if not contact:
        return jsonify({'message': 'Contact not found'}), 404
    
    contact.name = data['name']
    contact.phone = data['phone']
    contact.email = data['email']
    
    db.session.commit()
    return jsonify({'message': 'Contact updated successfully'})

# Delete a contact
@app.route('/contacts/<int:contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    contact = Contact.query.get(contact_id)
    
    if not contact:
        return jsonify({'message': 'Contact not found'}), 404
    
    db.session.delete(contact)
    db.session.commit()
    return jsonify({'message': 'Contact deleted successfully'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)  # Change to 8080 or another safe port

