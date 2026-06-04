ARG ODOO_IMAGE=odoo:19.0
FROM ${ODOO_IMAGE}
USER root
COPY requirements.txt /tmp/odoo-requirements.txt
RUN pip install --no-cache-dir --break-system-packages -r /tmp/odoo-requirements.txt
USER odoo
