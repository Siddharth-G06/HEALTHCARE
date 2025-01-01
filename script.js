$(document).ready(function() {
    $('#patientForm').on('submit', function(event) {
        event.preventDefault();

        const patientData = {
            name: $('#name').val(),
            email: $('#email').val(),
            phone: $('#phone').val(),
            address: $('#address').val(),
            date_of_birth: $('#date_of_birth').val(),
            age: $('#age').val(),
            gender: $('#gender').val(),
            disease: $('#disease').val(),
            criticality: $('#criticality').val(),
            alert_interval: $('#alert_interval').val(),
            next_alert_date: $('#next_alert_date').val()
        };

        console.log('Sending patient data:', patientData);

        $.ajax({
            type: 'POST',
            url: '/saveAll',
            data: JSON.stringify(patientData),
            contentType: 'application/json',
            success: function(response) {
                console.log('Response:', response);
                alert('Patient data saved successfully!');
                $('#patientForm')[0].reset();
            },
            error: function(error) {
                console.error('Error:', error);
                alert('Error saving patient data. Please try again.');
            }
        });
    });
});
