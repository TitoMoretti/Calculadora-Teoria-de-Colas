document.addEventListener('DOMContentLoaded', () => {
    var inputs = {
        arribo: document.getElementById('arriboId'),
        servicio: document.getElementById('servicioId'),
        poblacion: document.getElementById('poblacionId'),
    };
    var submitButton = document.getElementById('submitId');
    var resultsContainer = document.getElementById('results');

    //Mostrar y ocultar errores
    function showError(inputId, message) {
        var errorElement = document.getElementById(`error-${inputId}`);
        var inputElement = document.getElementById(inputId);

        errorElement.textContent = message;
        errorElement.style.display = 'block';
        inputElement.classList.add('error');
        
        return false;
    }
    function clearError(inputId) {
        var errorElement = document.getElementById(`error-${inputId}`);
        var inputElement = document.getElementById(inputId);
        errorElement.style.display = 'none';
        inputElement.classList.remove('error');
        return true;
    }

    //Validar entradas
    function validateInput(value, inputId) {
        if (!value.trim()) {
            return showError(inputId, 'Este campo es requerido');
        }
        var numValue = parseFloat(value);
        if (isNaN(numValue)) {
            return showError(inputId, 'Debe ser un número válido');
        }
        if (numValue <= 0) {
            return showError(inputId, 'Debe ser mayor que cero');
        }
        if (inputId === 'arriboId') {
            var serviceRate = parseFloat(inputs.servicio.value);
            if (serviceRate && numValue >= serviceRate) {
                return showError(inputId, 'La tasa de arribo debe ser menor que la tasa de servicio');
            }
        }
        if (inputId === 'servicioId') {
            var arrivalRate = parseFloat(inputs.arribo.value);
            if (arrivalRate && numValue <= arrivalRate) {
                return showError(inputId, 'La tasa de servicio debe ser mayor que la tasa de arribo');
            }
        }
        return clearError(inputId);
    }

    //Cálculos de MM1
    function calculateMM1(λ, μ, N) {
        //Utilización del sistema
        var rho = λ / μ;
        //Probabilidad de que no haya clientes en el sistema
        var p0 = 1 - rho;
        //Número promedio de clientes en la cola
        var lq = (λ * λ) / (μ * (μ - λ));
        //Número promedio de clientes en el sistema
        var l = λ / (μ - λ);
        //Tiempo promedio de espera en la cola
        var wq = λ / (μ * (μ - λ));
        //Tiempo promedio en el sistema
        var w = l / (μ - λ);
        //Probabilidad de que haya N clientes en el sistema
        var pn = p0 * Math.pow(rho, N);
        return { rho, p0, lq, l, wq, w, pn };
    }

    //Limpiar resultados
    function clearResults() {
        document.getElementById('result-rho').textContent = '';
        document.getElementById('result-p0').textContent = '';
        document.getElementById('result-lq').textContent = '';
        document.getElementById('result-l').textContent = '';
        document.getElementById('result-wq').textContent = '';
        document.getElementById('result-w').textContent = '';
        document.getElementById('result-n').textContent = '';
        document.getElementById('result-pn').textContent = '';
        resultsContainer.style.display = 'none';
    }

    //Mostrar resultados
    function displayResults(results, N) {
        clearResults();
        document.getElementById('result-rho').textContent = results.rho.toFixed(4);
        document.getElementById('result-p0').textContent = results.p0.toFixed(4) + ' = ' + results.p0.toFixed(4) * 100 + '%';
        document.getElementById('result-lq').textContent = results.lq.toFixed(4);
        document.getElementById('result-l').textContent = results.l.toFixed(4);
        document.getElementById('result-wq').textContent = results.wq.toFixed(4);
        document.getElementById('result-w').textContent = results.w.toFixed(4);
        document.getElementById('result-n').textContent = N;
        document.getElementById('result-pn').textContent = results.pn.toFixed(4) + ' = ' + results.pn.toFixed(4) * 100 + '%';
        resultsContainer.style.display = 'block';
    }

    //Validar entradas al escribir
    Object.entries(inputs).forEach(([key, input]) => {
        input.addEventListener('input', () => {
            validateInput(input.value, input.id);
        });
    });

    //Manejar el evento de clic en el botón de enviar
    submitButton.addEventListener('click', () => {
        clearResults();
        //Valida todas las entradas
        var isValid = Object.entries(inputs).every(([_, input]) => 
            validateInput(input.value, input.id)
        );
        if (isValid) {
            var λ = parseFloat(inputs.arribo.value);
            var μ = parseFloat(inputs.servicio.value);
            var N = parseFloat(inputs.poblacion.value);
            var results = calculateMM1(λ, μ, N);
            displayResults(results, N);
        }
    });
});