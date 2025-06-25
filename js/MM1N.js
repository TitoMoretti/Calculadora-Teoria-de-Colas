document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        inputs: {
            arribo: document.getElementById('arriboIdN'),
            servicio: document.getElementById('servicioIdN'),
            poblacion: document.getElementById('poblacionIdN'),
            nclientes: document.getElementById('nClientesIdN'),
        },
        submitButton: document.getElementById('submitIdN'),
        resultsContainer: document.getElementById('resultsN'),
        loadingIndicator: document.createElement('div')
    };

    elements.loadingIndicator.className = 'loading-indicator';
    elements.loadingIndicator.style.display = 'none';
    elements.submitButton.parentNode.insertBefore(elements.loadingIndicator, elements.submitButton);

    function sanitizeInput(value) {
        return value.replace(/[^0-9.]/g, '');
    }

    function showError(inputId, message) {
        const errorElement = document.getElementById(`error-${inputId}`);
        const inputElement = document.getElementById(inputId);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        inputElement.classList.add('error');
        return false;
    }

    function clearError(inputId) {
        const errorElement = document.getElementById(`error-${inputId}`);
        const inputElement = document.getElementById(inputId);
        errorElement.style.display = 'none';
        inputElement.classList.remove('error');
        return true;
    }

    function validateInput(value, inputId, N) {
        if (!value.trim()) {
            if (inputId === 'nClientesIdN') {
                clearError(inputId);
                return true;
            }
            return showError(inputId, 'Este campo es requerido');
        }
        const sanitizedValue = sanitizeInput(value);
        if (sanitizedValue !== value) {
            document.getElementById(inputId).value = sanitizedValue;
        }
        const numValue = parseFloat(sanitizedValue);
        if (isNaN(numValue)) {
            return showError(inputId, 'Debe ser un número válido');
        }
        if (numValue < 0) {
            return showError(inputId, 'Debe ser mayor o igual a cero');
        }
        if (inputId === 'arriboIdN' || inputId === 'servicioIdN') {
            if (numValue <= 0) {
                return showError(inputId, 'Debe ser mayor que cero');
            }
        }
        if (inputId === 'nClientesIdN') {
            const Nval = N !== undefined ? N : parseInt(elements.inputs.poblacion.value);
            if (!Number.isInteger(numValue)) {
                return showError(inputId, 'Debe ser un número entero');
            }
            if (Nval && (numValue < 0 || numValue > Nval)) {
                return showError(inputId, `Debe estar entre 0 y la capacidad máxima del sistema (${Nval})`);
            }
        }
        if (sanitizedValue.split('.')[1]?.length > 4) {
            return showError(inputId, 'Máximo 4 decimales permitidos');
        }
        return clearError(inputId);
    }

    function calculateMM1N(λ, μ, N, n) {
        //Utilización del sistema
        const rho = λ / μ;
        let P0, PB, tau, lambdaE, Ls, LQ, Ws, WQ, pn;
        //Probabilidad del sistema vacío
        P0 = (1 - rho) / (1 - Math.pow(rho, N + 1));
        //Probabilidad de bloqueo
        PB = Math.pow(rho, N) * (1 - rho) / (1 - Math.pow(rho, N + 1));
        if (rho === 1) {
            //Número promedio de clientes en el sistema
            Ls = N / 2;
            //Número promedio de clientes en la cola
            LQ = Ls - (1 - Math.pow(rho, N)) * rho / (1 - Math.pow(rho, N + 1));
        } else {
            //Número promedio de clientes en el sistema
            Ls = (rho / (1 - rho)) - ((N + 1) * Math.pow(rho, N + 1)) / (1 - Math.pow(rho, N + 1));
            //Número promedio de clientes en la cola
            LQ = (N * (N - 1)) / (2 * (N + 1));
        }
        //Tasa de rechazos
        tau = λ * PB;
        //Tasa de llegada efectiva
        lambdaE = λ * (1 - PB);
        //Tiempo promedio en el sistema
        Ws = Ls / lambdaE;
        //Tiempo promedio en la cola
        WQ = LQ / lambdaE;
        //Probabilidad de N clientes en el sistema
        pn = Math.pow(rho, n) * (1 - rho) / (1 - Math.pow(rho, N + 1));
        //Utilización efectiva del sistema
        const rhoE = lambdaE / μ;
        //Número promedio de clientes en cola para un sistema ocupado
        const lb = LQ / (1 - P0);
        //Tiempo promedio de clientes en cola para un sistema ocupado
        const wb = WQ / (1 - P0);
        return { rho, P0, PB, tau, lambdaE, Ls, LQ, Ws, WQ, pn, rhoE, lb, wb };
    }

    function clearResults() {
        [
            'result-rhoN', 'result-p0N', 'result-pbN', 'result-tauN', 'result-lambdaEN',
            'result-lsN', 'result-lqN', 'result-wsN', 'result-wqN', 'result-rhoEN',
            'result-lbN', 'result-wbN', 'result-pnN', 'result-nN'
        ].forEach(id => {
            document.getElementById(id).textContent = '';
        });
        elements.resultsContainer.style.display = 'none';
    }

    function displayResults(results, n, nInput) {
        const formatNumber = (num) => (isNaN(num) || !isFinite(num)) ? 'Error' : num.toFixed(4);
        const formatPercent = (num) => (isNaN(num) || !isFinite(num)) ? 'Error' : (num * 100).toFixed(2) + '%';
        document.getElementById('result-rhoN').textContent = formatNumber(results.rho);
        document.getElementById('result-p0N').textContent = `${formatNumber(results.P0)} = ${formatPercent(results.P0)}`;
        document.getElementById('result-pbN').textContent = `${formatNumber(results.PB)} = ${formatPercent(results.PB)}`;
        document.getElementById('result-tauN').textContent = formatNumber(results.tau);
        document.getElementById('result-lambdaEN').textContent = formatNumber(results.lambdaE);
        document.getElementById('result-lsN').textContent = formatNumber(results.Ls);
        document.getElementById('result-lqN').textContent = formatNumber(results.LQ);
        document.getElementById('result-wsN').textContent = formatNumber(results.Ws);
        document.getElementById('result-wqN').textContent = formatNumber(results.WQ);
        document.getElementById('result-rhoEN').textContent = formatNumber(results.rhoE);
        document.getElementById('result-lbN').textContent = formatNumber(results.lb);
        document.getElementById('result-wbN').textContent = formatNumber(results.wb);
        if (nInput !== undefined && nInput !== null && nInput !== '') {
            document.getElementById('result-nN').textContent = n;
            document.getElementById('result-pnN').textContent = `${formatNumber(results.pn)} = ${formatPercent(results.pn)}`;
        } else {
            document.getElementById('result-nN').textContent = '';
            document.getElementById('result-pnN').textContent = '';
        }
        elements.resultsContainer.style.display = 'block';
    }

    let debounceTimer;
    Object.entries(elements.inputs).forEach(([key, input]) => {
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                validateInput(input.value, input.id, parseInt(elements.inputs.poblacion.value));
            }, 300);
        });
    });

    elements.submitButton.addEventListener('click', async () => {
        try {
            //Limpiar resultados anteriores
            clearResults();

            //Validación
            const Nval = parseInt(elements.inputs.poblacion.value);
            const isValid = Object.entries(elements.inputs).every(([key, input]) => 
                validateInput(input.value, input.id, Nval)
            );
            if (isValid) {
                elements.loadingIndicator.style.display = 'block';
                elements.submitButton.disabled = true;
                const λ = parseFloat(elements.inputs.arribo.value);
                const μ = parseFloat(elements.inputs.servicio.value);
                const N = Nval;
                let nInput = elements.inputs.nclientes.value.trim();
                if (nInput === '') {
                    nInput = undefined;
                }
                //Número de clientes en el sistema
                let n = nInput !== undefined ? parseInt(nInput) : undefined;
                //Se realizan los cálculos
                const results = calculateMM1N(λ, μ, N, n || 0);
                displayResults(results, n, nInput);
            }
        } catch (error) {
            showError('submitIdN', error.message);
        } finally {
            elements.loadingIndicator.style.display = 'none';
            elements.submitButton.disabled = false;
        }
    });
}); 