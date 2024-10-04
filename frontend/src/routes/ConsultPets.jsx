import { useState, useEffect } from "react";
import CreatePet from "./CreatePet";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Modal,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TablePagination,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

// Función para calcular la edad en años dado una fecha de nacimiento
const calculateAge = (birthDate) => {
  const birthYear = new Date(birthDate).getFullYear();
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
};

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: "0.5rem",
  boxShadow: 24,
  p: 4,
  border: "none",
};

const ConsultPets = () => {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0); // Iniciar en la primera página (0 para el frontend, pero +1 en la API)
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [column, setColumn] = useState("nombre");
  const [order, setOrder] = useState("asc");
  const [totalItems, setTotalItems] = useState(0); // Count de resultados
  const [modalOpen, setModalOpen] = useState(false);

  const columns = [
    { id: "nombre", label: "Nombre" },
    { id: "especie", label: "Especie" },
    { id: "raza", label: "Raza" },
    { id: "sexo", label: "Sexo" },
    { id: "edad", label: "Edad" },
    { id: "dueno", label: "Dueño" },
  ];

  // Función para obtener los datos desde el backend
  const fetchMascotas = async (
    searchTerm = "",
    columnToSend = "nombre",
    page = 0,
    pageSize = 10
  ) => {
    setLoading(true);

    if (columnToSend === "edad") {
      columnToSend = "fecha_nacimiento";
    } else if (columnToSend === "dueno") {
      columnToSend = "usuario_cliente";
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/consult-mascotas/?search=${searchTerm}&column=${columnToSend}&order=${order}&page=${
          page + 1
        }&page_size=${pageSize}`
      );
      const data = await response.json();
      setMascotas(data.results);
      setTotalItems(data.count);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMascotas(search, column, page, rowsPerPage);
  }, [page, rowsPerPage, order]);

  const handleSearchClick = () => {
    setPage(0);
    fetchMascotas(search, column, 0, rowsPerPage);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOrderChange = () => {
    setOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  return (
    <Paper sx={{ padding: 2 }}>
      <Box
        sx={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}
      >
        <Button variant="contained" color="primary" onClick={handleOpenModal}>
          Agregar Mascota
        </Button>
      </Box>

      <h1>Consultar Mascotas</h1>

      {/* Barra de búsqueda */}
      <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
        <TextField
          label="Buscar"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FormControl>
          <InputLabel>Columna</InputLabel>
          <Select
            value={column}
            label="Columna"
            onChange={(e) => setColumn(e.target.value)}
          >
            {columns.map((col) => (
              <MenuItem key={col.id} value={col.id}>
                {col.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSearchClick}>
          Buscar
        </Button>
      </Box>

      {/* Botón para cambiar el orden (ascendente/descendente) */}
      <Box sx={{ marginBottom: 2 }}>
        <Button variant="contained" onClick={handleOrderChange}>
          Ordenar {order === "asc" ? "Descendente" : "Ascendente"}
        </Button>
      </Box>

      {/* Animación de carga */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", margin: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id}>{column.label}</TableCell>
                ))}
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mascotas.map((mascota) => (
                <TableRow key={mascota.id}>
                  <TableCell>{mascota.nombre}</TableCell>
                  <TableCell>{mascota.especie}</TableCell>
                  <TableCell>{mascota.raza}</TableCell>
                  <TableCell>{mascota.sexo}</TableCell>
                  <TableCell>
                    {calculateAge(mascota.fecha_nacimiento)}
                  </TableCell>{" "}
                  <TableCell>{mascota.usuario_cliente}</TableCell>
                  <TableCell>
                    <IconButton>
                      <Edit />
                    </IconButton>
                    <IconButton>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Paginación */}
      <TablePagination
        component="div"
        count={totalItems} // Total de resultados, ahora correctamente actualizado desde la API
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        labelRowsPerPage="Filas por página"
      />

      {/* Modal para agregar */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box sx={modalStyle}>
          <CreatePet />
        </Box>
      </Modal>
    </Paper>
  );
};

export default ConsultPets;
