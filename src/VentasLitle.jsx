import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  CloudUpload as CloudUploadIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const VentasLitle = () => {
  const [productos, setProductos] = useState([
    {
      id: 1,
      nombre: "Laptop HP",
      categoria: "Electrónicos",
      stock: 10,
      precio: 25000,
      imagen: "https://via.placeholder.com/150/0000FF/FFFFFF?text=Laptop",
    },
    {
      id: 2,
      nombre: "Mouse Inalámbrico",
      categoria: "Accesorios",
      stock: 25,
      precio: 800,
      imagen: "https://via.placeholder.com/150/FF0000/FFFFFF?text=Mouse",
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [cantidadVenta, setCantidadVenta] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Estados para el modal de venta
  const [openVentaDialog, setOpenVentaDialog] = useState(false);
  const [ventaData, setVentaData] = useState({
    productoId: "",
    cantidad: 1,
    clienteNombre: "",
    clienteEmail: "",
  });

  // Estados para el recibo
  const [openReciboDialog, setOpenReciboDialog] = useState(false);
  const [reciboData, setReciboData] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "",
    stock: "",
    precio: "",
    imagen: "",
  });

  const categorias = [
    "Electrónicos",
    "Accesorios",
    "Ropa",
    "Hogar",
    "Deportes",
    "Libros",
    "Licores",
  ];

  const resetForm = () => {
    setFormData({
      nombre: "",
      categoria: "",
      stock: "",
      precio: "",
      imagen: "",
    });
    setEditingProduct(null);
    setSelectedFile(null);
    setPreviewImage(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        setNotification({
          open: true,
          message: "Por favor selecciona un archivo de imagen válido",
          severity: "error",
        });
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setNotification({
          open: true,
          message: "La imagen debe ser menor a 5MB",
          severity: "error",
        });
        return;
      }

      setSelectedFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setFormData((prev) => ({
          ...prev,
          imagen: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenDialog = (producto = null) => {
    if (producto) {
      setFormData(producto);
      setEditingProduct(producto);
      setPreviewImage(producto.imagen);
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (
      !formData.nombre ||
      !formData.categoria ||
      !formData.stock ||
      !formData.precio
    ) {
      setNotification({
        open: true,
        message: "Por favor completa todos los campos obligatorios",
        severity: "error",
      });
      return;
    }

    if (editingProduct) {
      // Editar producto existente
      setProductos((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...formData,
                id: editingProduct.id,
                stock: parseInt(formData.stock),
                precio: parseFloat(formData.precio),
              }
            : p
        )
      );
      setNotification({
        open: true,
        message: "Producto actualizado exitosamente",
        severity: "success",
      });
    } else {
      // Agregar nuevo producto
      const newProduct = {
        ...formData,
        id: Date.now(),
        stock: parseInt(formData.stock),
        precio: parseFloat(formData.precio),
      };
      setProductos((prev) => [...prev, newProduct]);
      setNotification({
        open: true,
        message: "Producto agregado exitosamente",
        severity: "success",
      });
    }

    handleCloseDialog();
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      setProductos((prev) => prev.filter((p) => p.id !== id));
      setNotification({
        open: true,
        message: "Producto eliminado exitosamente",
        severity: "success",
      });
    }
  };

  const handleVender = (id) => {
    const cantidad = cantidadVenta[id] || 1;
    const producto = productos.find((p) => p.id === id);

    if (producto.stock < cantidad) {
      setNotification({
        open: true,
        message: "Stock insuficiente para realizar la venta",
        severity: "error",
      });
      return;
    }

    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: p.stock - cantidad } : p))
    );

    setCantidadVenta((prev) => ({ ...prev, [id]: 1 }));

    setNotification({
      open: true,
      message: `Venta realizada: ${cantidad} unidad(es) de ${producto.nombre}`,
      severity: "success",
    });
  };

  const handleCantidadVentaChange = (id, cantidad) => {
    setCantidadVenta((prev) => ({
      ...prev,
      [id]: Math.max(1, parseInt(cantidad) || 1),
    }));
  };

  // Funciones para el modal de venta
  const handleOpenVentaDialog = (productoId = "") => {
    setVentaData({
      productoId: productoId,
      cantidad: 1,
      clienteNombre: "",
      clienteEmail: "",
    });
    setOpenVentaDialog(true);
  };

  const handleCloseVentaDialog = () => {
    setOpenVentaDialog(false);
    setVentaData({
      productoId: "",
      cantidad: 1,
      clienteNombre: "",
      clienteEmail: "",
    });
  };

  const handleVentaInputChange = (e) => {
    const { name, value } = e.target;
    setVentaData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitVenta = () => {
    if (
      !ventaData.productoId ||
      !ventaData.cantidad ||
      !ventaData.clienteNombre
    ) {
      setNotification({
        open: true,
        message: "Por favor completa todos los campos obligatorios",
        severity: "error",
      });
      return;
    }

    const producto = productos.find(
      (p) => p.id === parseInt(ventaData.productoId)
    );

    if (!producto) {
      setNotification({
        open: true,
        message: "Producto no encontrado",
        severity: "error",
      });
      return;
    }

    if (producto.stock < ventaData.cantidad) {
      setNotification({
        open: true,
        message: "Stock insuficiente para realizar la venta",
        severity: "error",
      });
      return;
    }

    // Crear datos del recibo
    const total = producto.precio * ventaData.cantidad;
    const reciboInfo = {
      numeroRecibo: `REC-${Date.now()}`,
      fecha: new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      cliente: ventaData.clienteNombre,
      email: ventaData.clienteEmail,
      producto: producto.nombre,
      categoria: producto.categoria,
      cantidad: parseInt(ventaData.cantidad),
      precioUnitario: producto.precio,
      subtotal: total,
      impuestos: total * 0.16, // 16% IVA
      total: total * 1.16,
    };

    // Actualizar stock
    setProductos((prev) =>
      prev.map((p) =>
        p.id === parseInt(ventaData.productoId)
          ? { ...p, stock: p.stock - parseInt(ventaData.cantidad) }
          : p
      )
    );

    // Guardar datos del recibo y mostrar modal de recibo
    setReciboData(reciboInfo);

    // Mostrar mensaje de venta realizada con estilo formal
    setNotification({
      open: true,
      message: `Venta procesada exitosamente. Cliente: ${
        ventaData.clienteNombre
      } | Producto: ${producto.nombre} | Total: $${total.toLocaleString()}`,
      severity: "success",
    });

    handleCloseVentaDialog();

    // Abrir modal de recibo automáticamente
    setTimeout(() => {
      setOpenReciboDialog(true);
    }, 500);
  };

  // Funciones para el recibo
  const handleCloseReciboDialog = () => {
    setOpenReciboDialog(false);
    setReciboData(null);
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoEmpresa(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generarPDF = async () => {
    const elemento = document.getElementById("recibo-content");
    if (!elemento || !reciboData) {
      setNotification({
        open: true,
        message: "No se encontró el contenido del recibo",
        severity: "error",
      });
      return;
    }

    try {
      // Configurar opciones para html2canvas
      const canvas = await html2canvas(elemento, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: elemento.scrollWidth,
        height: elemento.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

      // Crear PDF con configuración específica
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Calcular dimensiones para ajustar a una sola página
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calcular el tamaño que ocupa la imagen
      const imgWidth = pdfWidth - 20; // 10mm margen a cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Si la imagen es más alta que la página, ajustarla para que quepa
      let finalWidth, finalHeight, xPosition, yPosition;

      if (imgHeight > pdfHeight - 20) {
        // Si es muy alta, ajustar por altura
        finalHeight = pdfHeight - 20; // 10mm margen arriba y abajo
        finalWidth = (canvas.width * finalHeight) / canvas.height;
        xPosition = (pdfWidth - finalWidth) / 2; // Centrar horizontalmente
        yPosition = 10;
      } else {
        // Si cabe perfectamente
        finalWidth = imgWidth;
        finalHeight = imgHeight;
        xPosition = 10;
        yPosition = (pdfHeight - finalHeight) / 2; // Centrar verticalmente
      }

      // Agregar la imagen en una sola página
      pdf.addImage(
        imgData,
        "PNG",
        xPosition,
        yPosition,
        finalWidth,
        finalHeight
      );

      // Guardar PDF
      const fileName = `Recibo_${reciboData.numeroRecibo}.pdf`;
      pdf.save(fileName);

      setNotification({
        open: true,
        message: `Recibo PDF "${fileName}" descargado exitosamente`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error detallado al generar PDF:", error);
      setNotification({
        open: true,
        message: `Error al generar el PDF: ${
          error.message || "Error desconocido"
        }`,
        severity: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* SAP Fiori Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <Container maxWidth="xl">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <ShoppingCartIcon className="text-white text-lg" />
              </div>
              <div>
                <Typography
                  variant="h5"
                  className="text-gray-900 font-semibold"
                >
                  Sistema Licoreria La Monarca
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Gestión de Inventario y Ventas
                </Typography>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Usuario: Viviana | {new Date().toLocaleDateString()}
            </div>
          </div>
        </Container>
      </div>

      <Container maxWidth="xl" className="py-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Typography variant="body2" className="text-gray-600">
            Inicio &gt; Ventas &gt; Gestión de Productos
          </Typography>
        </div>

        {/* Action Toolbar - SAP Style */}
        <div className="mb-6">
          <Paper elevation={1} className="p-4 bg-white border border-gray-200">
            <div className="flex justify-between items-center">
              <Typography variant="h6" className="text-gray-900 font-medium">
                Gestión de Productos
              </Typography>
              <div className="flex gap-3">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{
                    backgroundColor: "#0070f3",
                    "&:hover": { backgroundColor: "#0051a2" },
                    textTransform: "none",
                    borderRadius: "4px",
                    fontWeight: 500,
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  Crear Producto
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ShoppingCartIcon />}
                  onClick={() => handleOpenVentaDialog()}
                  sx={{
                    borderColor: "#0070f3",
                    color: "#0070f3",
                    textTransform: "none",
                    borderRadius: "4px",
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: "rgba(0, 112, 243, 0.04)",
                      borderColor: "#0051a2",
                    },
                  }}
                >
                  Nueva Venta
                </Button>
              </div>
            </div>
          </Paper>
        </div>

        {/* SAP Fiori Table */}
        <Paper elevation={1} className="border border-gray-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <Typography variant="h6" className="text-gray-900 font-medium">
                Lista de Productos ({productos.length})
              </Typography>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Ordenar por:</span>
                <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option>Nombre</option>
                  <option>Precio</option>
                  <option>Stock</option>
                </select>
              </div>
            </div>
          </div>

          <TableContainer sx={{ backgroundColor: "white" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#fafafa" }}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "0.875rem",
                    }}
                  >
                    Producto
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "0.875rem",
                    }}
                  >
                    Categoría
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "0.875rem",
                    }}
                  >
                    Stock Disponible
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "0.875rem",
                    }}
                  >
                    Precio Unitario
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "0.875rem",
                    }}
                  >
                    Estado
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "0.875rem",
                    }}
                  >
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productos.map((producto, index) => (
                  <TableRow
                    key={producto.id}
                    sx={{
                      "&:hover": { backgroundColor: "#f9fafb" },
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            producto.imagen ||
                            "https://via.placeholder.com/48/E5E7EB/6B7280?text=IMG"
                          }
                          alt={producto.nombre}
                          className="w-12 h-12 object-cover rounded border border-gray-200"
                        />
                        <div>
                          <Typography
                            variant="subtitle2"
                            className="font-medium text-gray-900"
                          >
                            {producto.nombre}
                          </Typography>
                          <Typography
                            variant="caption"
                            className="text-gray-500"
                          >
                            SKU: PRD-{String(producto.id).padStart(4, "0")}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {producto.categoria}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900 font-medium">
                          {producto.stock}
                        </span>
                        <span className="text-gray-500 text-sm">unidades</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="subtitle2"
                        className="font-semibold text-gray-900"
                      >
                        ${producto.precio.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {producto.stock > 10 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ● Disponible
                        </span>
                      ) : producto.stock > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ● Stock Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ● Agotado
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpenVentaDialog(producto.id)}
                          disabled={producto.stock === 0}
                          sx={{
                            backgroundColor: "#0070f3",
                            "&:hover": { backgroundColor: "#0051a2" },
                            textTransform: "none",
                            borderRadius: "4px",
                            fontWeight: 500,
                            fontSize: "0.75rem",
                            minWidth: "80px",
                            boxShadow: "none",
                            "&:hover": {
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            },
                            "&:disabled": {
                              backgroundColor: "#e5e7eb",
                              color: "#9ca3af",
                            },
                          }}
                        >
                          Vender
                        </Button>
                        <IconButton
                          onClick={() => handleOpenDialog(producto)}
                          size="small"
                          sx={{
                            color: "#6b7280",
                            "&:hover": {
                              backgroundColor: "#f3f4f6",
                              color: "#374151",
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(producto.id)}
                          size="small"
                          sx={{
                            color: "#6b7280",
                            "&:hover": {
                              backgroundColor: "#fef2f2",
                              color: "#dc2626",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Dialog para Agregar/Editar Producto */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle className="bg-blue-50">
            {editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}
          </DialogTitle>
          <DialogContent className="mt-4">
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre del Producto"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="mb-4"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    label="Categoría"
                  >
                    {categorias.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Precio"
                  name="precio"
                  type="number"
                  value={formData.precio}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box className="space-y-4">
                  <Typography variant="subtitle2" className="text-gray-700">
                    Imagen del Producto
                  </Typography>

                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    className="w-full h-12 border-dashed border-2 border-gray-300 hover:border-blue-500"
                  >
                    {selectedFile ? "Cambiar Imagen" : "Subir Imagen"}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>

                  {selectedFile && (
                    <Typography variant="caption" className="text-gray-600">
                      Archivo seleccionado: {selectedFile.name}
                    </Typography>
                  )}
                </Box>
              </Grid>
              {previewImage && (
                <Grid item xs={12}>
                  <Box className="flex justify-center">
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Vista previa"
                        className="max-w-xs max-h-48 object-cover rounded-lg border shadow-md"
                      />
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewImage(null);
                          setFormData((prev) => ({ ...prev, imagen: "" }));
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions className="p-4">
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              className="bg-blue-600"
            >
              {editingProduct ? "Actualizar" : "Agregar"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* SAP Fiori Style Sales Dialog */}
        <Dialog
          open={openVentaDialog}
          onClose={handleCloseVentaDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e5e7eb",
              padding: "20px 24px",
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                <ShoppingCartIcon className="text-white" />
              </div>
              <div>
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-900"
                >
                  Nueva Transacción de Venta
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Complete los datos para procesar la venta
                </Typography>
              </div>
            </div>
          </DialogTitle>
          <DialogContent
            sx={{
              padding: "32px",
              backgroundColor: "white",
            }}
          >
            <Grid container spacing={4}>
              {/* Card de Selección de Producto */}
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    padding: "24px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <Box
                      sx={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: "#0070f3",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                      }}
                    >
                      <ShoppingCartIcon
                        sx={{ color: "white", fontSize: "20px" }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#1e293b",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        Selección de Producto
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        Elige el producto que deseas vender
                      </Typography>
                    </Box>
                  </Box>

                  <FormControl
                    fullWidth
                    required
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "white",
                        "& fieldset": {
                          borderColor: "#d1d5db",
                          borderWidth: "1px",
                        },
                        "&:hover fieldset": {
                          borderColor: "#0070f3",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#0070f3",
                          borderWidth: "2px",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "#6b7280",
                        "&.Mui-focused": {
                          color: "#0070f3",
                        },
                      },
                    }}
                  >
                    <InputLabel>Seleccionar Producto</InputLabel>
                    <Select
                      name="productoId"
                      value={ventaData.productoId}
                      onChange={handleVentaInputChange}
                      label="Seleccionar Producto"
                    >
                      {productos
                        .filter((p) => p.stock > 0)
                        .map((producto) => (
                          <MenuItem key={producto.id} value={producto.id}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                width: "100%",
                              }}
                            >
                              <img
                                src={
                                  producto.imagen ||
                                  "https://via.placeholder.com/48/E5E7EB/6B7280?text=IMG"
                                }
                                alt={producto.nombre}
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  objectFit: "cover",
                                  borderRadius: "6px",
                                  border: "1px solid #e5e7eb",
                                }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 600, color: "#1f2937" }}
                                >
                                  {producto.nombre}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#6b7280", display: "block" }}
                                >
                                  Stock: {producto.stock} unidades • $
                                  {producto.precio.toLocaleString()}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#059669",
                                    backgroundColor: "#d1fae5",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: 500,
                                  }}
                                >
                                  {producto.categoria}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Paper>
              </Grid>

              {/* Card de Detalles de Venta */}
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    padding: "24px",
                    backgroundColor: "#fefefe",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <Box
                      sx={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: "#059669",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "white",
                          fontSize: "18px",
                          fontWeight: "bold",
                        }}
                      >
                        📊
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#1e293b",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        Detalles de Venta
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        Especifica la cantidad y revisa el total
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Cantidad"
                        name="cantidad"
                        type="number"
                        value={ventaData.cantidad}
                        onChange={handleVentaInputChange}
                        required
                        inputProps={{
                          min: 1,
                          max: ventaData.productoId
                            ? productos.find(
                                (p) => p.id === parseInt(ventaData.productoId)
                              )?.stock || 1
                            : 1,
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            backgroundColor: "white",
                            "& fieldset": {
                              borderColor: "#d1d5db",
                            },
                            "&:hover fieldset": {
                              borderColor: "#059669",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#059669",
                              borderWidth: "2px",
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: "#6b7280",
                            "&.Mui-focused": {
                              color: "#059669",
                            },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={8}>
                      {ventaData.productoId ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "16px 20px",
                            background:
                              "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                            borderRadius: "12px",
                            border: "1px solid #0284c7",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "rgba(255,255,255,0.9)",
                                fontSize: "13px",
                                fontWeight: 500,
                              }}
                            >
                              TOTAL A PAGAR
                            </Typography>
                            <Typography
                              variant="h4"
                              sx={{
                                color: "white",
                                fontWeight: "bold",
                                lineHeight: 1.2,
                              }}
                            >
                              $
                              {(
                                (productos.find(
                                  (p) => p.id === parseInt(ventaData.productoId)
                                )?.precio || 0) * ventaData.cantidad
                              ).toLocaleString()}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              fontSize: "32px",
                            }}
                          >
                            💰
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "20px",
                            border: "2px dashed #d1d5db",
                            borderRadius: "12px",
                            backgroundColor: "#f9fafb",
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{ color: "#6b7280", textAlign: "center" }}
                          >
                            💡 Selecciona un producto para calcular el total
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Card de Información del Cliente */}
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    padding: "24px",
                    backgroundColor: "#fffbeb",
                    border: "1px solid #fbbf24",
                    borderRadius: "12px",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <Box
                      sx={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: "#f59e0b",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "white",
                          fontSize: "18px",
                          fontWeight: "bold",
                        }}
                      >
                        👤
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#1e293b",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        Información del Cliente
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#92400e" }}>
                        Datos necesarios para completar la venta
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nombre del Cliente *"
                        name="clienteNombre"
                        value={ventaData.clienteNombre}
                        onChange={handleVentaInputChange}
                        required
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            backgroundColor: "white",
                            "& fieldset": {
                              borderColor: "#d1d5db",
                            },
                            "&:hover fieldset": {
                              borderColor: "#f59e0b",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#f59e0b",
                              borderWidth: "2px",
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: "#6b7280",
                            "&.Mui-focused": {
                              color: "#f59e0b",
                            },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email del Cliente (Opcional)"
                        name="clienteEmail"
                        type="email"
                        value={ventaData.clienteEmail}
                        onChange={handleVentaInputChange}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            backgroundColor: "white",
                            "& fieldset": {
                              borderColor: "#d1d5db",
                            },
                            "&:hover fieldset": {
                              borderColor: "#f59e0b",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#f59e0b",
                              borderWidth: "2px",
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: "#6b7280",
                            "&.Mui-focused": {
                              color: "#f59e0b",
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Resumen de la venta */}
              {ventaData.productoId && (
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      padding: "20px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        marginBottom: "16px",
                        color: "#1e293b",
                        fontWeight: 600,
                      }}
                    >
                      Resumen de Venta
                    </Typography>
                    {(() => {
                      const producto = productos.find(
                        (p) => p.id === parseInt(ventaData.productoId)
                      );
                      const subtotal =
                        (producto?.precio || 0) * ventaData.cantidad;
                      const impuestos = subtotal * 0.16;
                      const total = subtotal + impuestos;
                      return (
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ marginBottom: "8px" }}>
                              <Typography
                                variant="body2"
                                sx={{ color: "#64748b", fontSize: "0.875rem" }}
                              >
                                Producto:
                              </Typography>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 500 }}
                              >
                                {producto?.nombre}
                              </Typography>
                            </Box>
                            <Box sx={{ marginBottom: "8px" }}>
                              <Typography
                                variant="body2"
                                sx={{ color: "#64748b", fontSize: "0.875rem" }}
                              >
                                Precio unitario:
                              </Typography>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 500 }}
                              >
                                ${producto?.precio.toLocaleString()}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ marginBottom: "8px" }}>
                              <Typography
                                variant="body2"
                                sx={{ color: "#64748b", fontSize: "0.875rem" }}
                              >
                                Cantidad:
                              </Typography>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 500 }}
                              >
                                {ventaData.cantidad} unidad(es)
                              </Typography>
                            </Box>
                            <Box sx={{ marginBottom: "8px" }}>
                              <Typography
                                variant="body2"
                                sx={{ color: "#64748b", fontSize: "0.875rem" }}
                              >
                                Cliente:
                              </Typography>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 500 }}
                              >
                                {ventaData.clienteNombre || "Sin especificar"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                marginTop: "16px",
                                padding: "12px",
                                backgroundColor: "white",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: "4px",
                                }}
                              >
                                <Typography variant="body2">
                                  Subtotal:
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  ${subtotal.toLocaleString()}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: "8px",
                                }}
                              >
                                <Typography variant="body2">
                                  IVA (16%):
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  ${impuestos.toLocaleString()}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  paddingTop: "8px",
                                  borderTop: "1px solid #e2e8f0",
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 600 }}
                                >
                                  Total a pagar:
                                </Typography>
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 700, color: "#059669" }}
                                >
                                  ${total.toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      );
                    })()}
                  </Paper>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions
            sx={{
              padding: "16px 24px",
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <Button
              onClick={handleCloseVentaDialog}
              sx={{
                textTransform: "none",
                color: "#6b7280",
                "&:hover": {
                  backgroundColor: "#f3f4f6",
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitVenta}
              variant="contained"
              disabled={!ventaData.productoId || !ventaData.clienteNombre}
              sx={{
                backgroundColor: "#0070f3",
                "&:hover": { backgroundColor: "#0051a2" },
                textTransform: "none",
                borderRadius: "4px",
                fontWeight: 500,
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                },
                "&:disabled": {
                  backgroundColor: "#e5e7eb",
                  color: "#9ca3af",
                },
              }}
            >
              Procesar Venta
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Recibo */}
        <Dialog
          open={openReciboDialog}
          onClose={handleCloseReciboDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e5e7eb",
              padding: "20px 24px",
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center">
                <ReceiptIcon className="text-white" />
              </div>
              <div>
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-900"
                >
                  Recibo de Venta
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {reciboData?.numeroRecibo}
                </Typography>
              </div>
            </div>
          </DialogTitle>

          <DialogContent sx={{ padding: 0 }}>
            {reciboData && (
              <div
                id="recibo-content"
                style={{
                  backgroundColor: "white",
                  padding: "32px",
                  fontFamily: "Arial, sans-serif",
                  color: "#000",
                  maxWidth: "800px",
                  margin: "0 auto",
                }}
              >
                {/* Header del Recibo */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "40px",
                    paddingBottom: "20px",
                    borderBottom: "2px solid #e5e7eb",
                  }}
                >
                  <div style={{ flex: 1, maxWidth: "50%" }}>
                    <img
                      src="/logomonarca.jpeg"
                      alt="Logo Empresa"
                      style={{
                        height: "80px",
                        width: "auto",
                        marginBottom: "20px",
                        display: "block",
                      }}
                    />
                    <h2
                      style={{
                        fontSize: "26px",
                        fontWeight: "bold",
                        color: "#1f2937",
                        marginBottom: "12px",
                        margin: "0 0 12px 0",
                        lineHeight: "1.2",
                      }}
                    >
                      LICORERIA LA MONARCA S.A.
                    </h2>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        lineHeight: "1.6",
                      }}
                    >
                      <div style={{ marginBottom: "4px" }}>
                        <strong>RFC:</strong> LIC123456789
                      </div>
                      <div style={{ marginBottom: "4px" }}>
                        <strong>Dirección:</strong> Los Rosales, Ecuador
                      </div>
                      <div style={{ marginBottom: "4px" }}>
                        <strong>Ciudad:</strong> Quito, Pichincha
                      </div>
                      <div style={{ marginBottom: "4px" }}>
                        <strong>Teléfono:</strong> +593 96 733 7745
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", maxWidth: "40%" }}>
                    <h1
                      style={{
                        fontSize: "36px",
                        fontWeight: "bold",
                        color: "#0070f3",
                        marginBottom: "12px",
                        margin: "0 0 12px 0",
                      }}
                    >
                      RECIBO
                    </h1>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        marginBottom: "8px",
                        color: "#374151",
                      }}
                    >
                      No. {reciboData.numeroRecibo}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        marginBottom: "16px",
                      }}
                    >
                      Fecha: {reciboData.fecha}
                    </div>
                    <div
                      style={{
                        backgroundColor: "#f0f9ff",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #0ea5e9",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#0369a1",
                          marginBottom: "4px",
                        }}
                      >
                        TOTAL A PAGAR
                      </div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          color: "#0369a1",
                        }}
                      >
                        ${reciboData.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información del Cliente */}
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "20px",
                    borderRadius: "8px",
                    marginBottom: "30px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      marginBottom: "16px",
                      margin: "0 0 16px 0",
                      color: "#1f2937",
                    }}
                  >
                    📋 Información del Cliente
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "20px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                          fontWeight: "500",
                          marginBottom: "6px",
                        }}
                      >
                        CLIENTE:
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#1f2937",
                        }}
                      >
                        {reciboData.cliente}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                          fontWeight: "500",
                          marginBottom: "6px",
                        }}
                      >
                        EMAIL:
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#1f2937",
                        }}
                      >
                        {reciboData.email || "No proporcionado"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalle de la Venta */}
                <div style={{ marginBottom: "30px" }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      marginBottom: "16px",
                      margin: "0 0 16px 0",
                      color: "#1f2937",
                    }}
                  >
                    🛒 Detalle de la Venta
                  </h3>
                  <table
                    style={{
                      width: "100%",
                      border: "1px solid #d1d5db",
                      borderCollapse: "collapse",
                      backgroundColor: "white",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <thead style={{ backgroundColor: "#f3f4f6" }}>
                      <tr>
                        <th
                          style={{
                            border: "1px solid #d1d5db",
                            padding: "16px 12px",
                            textAlign: "left",
                            fontWeight: "600",
                            fontSize: "14px",
                            color: "#374151",
                          }}
                        >
                          PRODUCTO
                        </th>
                        <th
                          style={{
                            border: "1px solid #d1d5db",
                            padding: "16px 12px",
                            textAlign: "center",
                            fontWeight: "600",
                            fontSize: "14px",
                            color: "#374151",
                            width: "15%",
                          }}
                        >
                          CANT.
                        </th>
                        <th
                          style={{
                            border: "1px solid #d1d5db",
                            padding: "16px 12px",
                            textAlign: "right",
                            fontWeight: "600",
                            fontSize: "14px",
                            color: "#374151",
                            width: "20%",
                          }}
                        >
                          PRECIO UNIT.
                        </th>
                        <th
                          style={{
                            border: "1px solid #d1d5db",
                            padding: "16px 12px",
                            textAlign: "right",
                            fontWeight: "600",
                            fontSize: "14px",
                            color: "#374151",
                            width: "20%",
                          }}
                        >
                          SUBTOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ backgroundColor: "#fafafa" }}>
                        <td
                          style={{
                            border: "1px solid #d1d5db",
                            padding: "16px 12px",
                            backgroundColor: "white",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                marginBottom: "6px",
                                color: "#1f2937",
                              }}
                            >
                              {reciboData.producto}
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontStyle: "italic",
                              }}
                            >
                              Categoría: {reciboData.categoria}
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            border: "1px solid #d1d5db",
                            padding: "16px 12px",
                            textAlign: "center",
                            backgroundColor: "white",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1f2937",
                          }}
                        >
                          {reciboData.cantidad}
                        </td>
                        <td
                          style={{
                            border: "1px solid #d1d5db",
                            padding: "16px 12px",
                            textAlign: "right",
                            backgroundColor: "white",
                            fontSize: "15px",
                            fontWeight: "500",
                            color: "#1f2937",
                          }}
                        >
                          ${reciboData.precioUnitario.toLocaleString()}
                        </td>
                        <td
                          style={{
                            border: "1px solid #d1d5db",
                            padding: "16px 12px",
                            textAlign: "right",
                            backgroundColor: "white",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#059669",
                          }}
                        >
                          ${reciboData.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totales */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "40px",
                  }}
                >
                  <div style={{ width: "320px" }}>
                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          marginBottom: "12px",
                          margin: "0 0 12px 0",
                          color: "#374151",
                        }}
                      >
                        💰 Resumen de Pago
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                          paddingBottom: "8px",
                        }}
                      >
                        <div style={{ fontSize: "15px", color: "#6b7280" }}>
                          Subtotal:
                        </div>
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: "500",
                            color: "#374151",
                          }}
                        >
                          ${reciboData.subtotal.toLocaleString()}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "12px",
                          paddingBottom: "12px",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ fontSize: "15px", color: "#6b7280" }}>
                          IVA (16%):
                        </div>
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: "500",
                            color: "#374151",
                          }}
                        >
                          ${reciboData.impuestos.toLocaleString()}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "12px 0",
                          backgroundColor: "#0f766e",
                          margin: "0 -20px -20px -20px",
                          paddingLeft: "20px",
                          paddingRight: "20px",
                          borderBottomLeftRadius: "8px",
                          borderBottomRightRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "white",
                          }}
                        >
                          TOTAL:
                        </div>
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            color: "white",
                          }}
                        >
                          ${reciboData.total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer del Recibo */}
                <div
                  style={{
                    marginTop: "40px",
                    paddingTop: "20px",
                    borderTop: "2px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "40px",
                      marginBottom: "20px",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          marginBottom: "8px",
                          margin: "0 0 8px 0",
                          color: "#374151",
                        }}
                      >
                        📞 Contacto de Soporte
                      </h4>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          lineHeight: "1.5",
                        }}
                      >
                        WhatsApp: +593 96 733 7745
                        <br />
                        Email: soporte@lamonarca.com
                        <br />
                        Horario: Lunes a Sábado 8:00 AM - 8:00 PM
                      </div>
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          marginBottom: "8px",
                          margin: "0 0 8px 0",
                          color: "#374151",
                        }}
                      >
                        ℹ️ Políticas
                      </h4>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          lineHeight: "1.5",
                        }}
                      >
                        • Cambios y devoluciones hasta 30 días
                        <br />
                        • Garantía de calidad en todos nuestros productos
                        <br />• Conserve este recibo como comprobante
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      backgroundColor: "#f0f9ff",
                      borderRadius: "8px",
                      border: "1px solid #bae6fd",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "16px",
                        color: "#0369a1",
                        fontWeight: "600",
                        marginBottom: "4px",
                      }}
                    >
                      ¡Gracias por confiar en Licorería La Monarca!
                    </div>
                    <div style={{ fontSize: "12px", color: "#0369a1" }}>
                      Este recibo es válido como comprobante de pago oficial
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "16px",
                      textAlign: "center",
                      fontSize: "11px",
                      color: "#9ca3af",
                    }}
                  >
                    Recibo generado digitalmente el{" "}
                    {new Date().toLocaleString("es-ES")} | Sistema de Ventas La
                    Monarca v1.0
                  </div>
                </div>
              </div>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              padding: "16px 24px",
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <Button
              onClick={handleCloseReciboDialog}
              sx={{
                textTransform: "none",
                color: "#6b7280",
              }}
            >
              Cerrar
            </Button>
            <Button
              onClick={generarPDF}
              variant="contained"
              startIcon={<ReceiptIcon />}
              sx={{
                backgroundColor: "#0070f3",
                "&:hover": { backgroundColor: "#0051a2" },
                textTransform: "none",
                borderRadius: "4px",
                fontWeight: 500,
              }}
            >
              Descargar PDF
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notificaciones */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() =>
              setNotification((prev) => ({ ...prev, open: false }))
            }
            severity={notification.severity}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>

      {/* SAP Fiori Footer */}
      <div className="bg-white border-t border-gray-200 mt-8">
        <Container maxWidth="xl">
          <div className="py-4 flex justify-between items-center text-sm text-gray-600">
            <div>
              © 2025 Sistema de Ventas. Desarrollado con tecnología empresarial.
            </div>
            <div className="flex items-center space-x-4">
              <span>Versión 1.0</span>
              <span>|</span>
              <span>Soporte Técnico</span>
              <span>|</span>
              <span>Estado: En línea</span>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default VentasLitle;
