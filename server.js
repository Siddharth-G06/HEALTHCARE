// Importing dependencies
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Setting up the environment and framework for the app
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Create connection to MySQL database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'KiSh2403',
    database: 'patient_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Check if connected
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
    connection.release();
});

// Define a route for the home page
app.get('/', (req, res) => {
    res.send('Welcome to the Patient Management System!');
});

// Save patient records, disease information, and alert interval
app.post('/saveAll', (req, res) => {
    const { name, email, phone, address, date_of_birth, age, gender, disease, criticality, alert_interval, next_alert_date } = req.body;

    const patientQuery = 'INSERT INTO patients (name, email, phone, address, date_of_birth, age, gender, disease, criticality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    pool.query(patientQuery, [name, email, phone, address, date_of_birth, age, gender, disease, criticality], (err, result) => {
        if (err) {
            console.error('Error inserting patient data:', err);
            res.status(500).send('Error saving patient data');
        } else {
            const patientId = result.insertId;
            const diseaseQuery = 'INSERT INTO diseases (patient_id, disease_name, diagnosis_date) VALUES (?, ?, ?)';
            const alertQuery = 'INSERT INTO alerts (patient_id, disease_id, alert_interval, next_alert_date) VALUES (?, ?, ?, ?)';
            
            pool.query(diseaseQuery, [patientId, disease, date_of_birth], (err, diseaseResult) => {
                if (err) {
                    console.error('Error inserting disease data:', err);
                    res.status(500).send('Error saving disease data');
                } else {
                    const diseaseId = diseaseResult.insertId;
                    pool.query(alertQuery, [patientId, diseaseId, alert_interval, next_alert_date], (err, alertResult) => {
                        if (err) {
                            console.error('Error inserting alert data:', err);
                            res.status(500).send('Error saving alert data');
                        } else {
                            res.status(200).send('All data saved successfully');
                            checkCriticalityAndSendAlert(name, disease, criticality, email, address);
                        }
                    });
                }
            });
        }
    });
});

// Function to send email alerts for critical patients
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-password'
    }
});

const checkCriticalityAndSendAlert = (name, disease, criticality, email, address) => {
    if (criticality === 'High') {
        // Send alert to the doctor
        const doctorMailOptions = {
            from: 'your-email@gmail.com',
            to: 'doctor-email@gmail.com',
            subject: 'Urgent: High Criticality Patient Alert',
            text: `Patient Name: ${name}\nDisease: ${disease}\nCriticality: ${criticality}\nAddress: ${address}\nPlease visit the patient immediately.`
        };

        transporter.sendMail(doctorMailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email to doctor:', error);
            } else {
                console.log('Email sent to doctor: ' + info.response);
            }
        });

        // Send alert to the patient
        const patientMailOptions = {
            from: 'your-email@gmail.com',
            to: email,
            subject: 'High Criticality Alert: Please Stay at Home',
            text: `Dear ${name},\n\nThis is a reminder for your high criticality condition. Please stay at home. The doctor will visit you shortly.\n\nBest Regards,\nYour Healthcare Team`
        };

        transporter.sendMail(patientMailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email to patient:', error);
            } else {
                console.log('Email sent to patient: ' + info.response);
            }
        });
    }
};

// Schedule regular check-up emails
cron.schedule('0 9 * * *', () => {  // This will run every day at 9 AM
    const query = 'SELECT * FROM patients WHERE criticality = "High"';
    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching critical patients:', err);
        } else {
            results.forEach(patient => {
                const mailOptions = {
                    from: 'your-email@gmail.com',
                    to: patient.email,
                    subject: 'Regular Check-Up Reminder',
                    text: `Dear ${patient.name},\n\nThis is a reminder for your regular check-up. Please visit the clinic as per the prescribed schedule.\n\nBest Regards,\nYour Healthcare Team`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email:', error);
                    } else {
                        console.log('Check-up reminder email sent to:', patient.email);
                    }
                });
            });
        }
    });
});

// Starting the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
