from datetime import date
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.db import transaction
from .models import Usuarios, Mascotas
from .serializers import MascotaSerializer

class CustomPagination(PageNumberPagination):
    page_size = 10  # Número de registros por página
    page_size_query_param = 'page_size'  # Puedes ajustar el tamaño de la página desde la query
    max_page_size = 100  # Tamaño máximo de la página que puedes solicitar

@api_view(['POST'])
def check_user_exists(request):
    user = request.data.get('user')
    password = request.data.get('password')

    if not user or not password:
        return Response({"error": "Username and cedula are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        userResponse = Usuarios.objects.get(usuario=user) 

        if check_password(password, userResponse.clave):
            request.session['username'] = userResponse.usuario
            return Response({'exists': True, 'message': f'User {user} authenticated.', 'rol': userResponse.rol_id}, status=status.HTTP_200_OK)
        else:
            return Response({'exists': False, 'message': 'Password incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

    except:
        return Response({'exists': False, 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def create_pet(request):
    try:
        usuario = request.data.get('usuario_cliente')
        
        # Verify client existence
        try:
            usuario_cliente = Usuarios.objects.get(usuario=usuario)  # Usar la columna usuario
        except Usuarios.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create a new pet that's associated with a client
        data = request.data
        data['usuario_cliente'] = usuario_cliente.usuario  
        
        serializer = MascotaSerializer(data=data)
        if serializer.is_valid():
            serializer.save()  
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
def consult_client(request):
    search = request.GET.get('search', '')
    column = request.GET.get('column', 'usuario')  # Ajustar para que 'usuario' sea la columna por defecto
    order = request.GET.get('order', 'asc')

    try:
        # Filtrar usuarios por rol 4
        usuarios_clientes = Usuarios.objects.filter(rol=4)

        if search:
            # Asegurarse de que el filtrado se realice en la columna especificada
            kwargs = {f'{column}__icontains': search}
            usuarios_clientes = usuarios_clientes.filter(**kwargs)

        if order == 'desc':
            usuarios_clientes = usuarios_clientes.order_by(f'-{column}')
        else:
            usuarios_clientes = usuarios_clientes.order_by(column)

        paginator = CustomPagination()
        result_page = paginator.paginate_queryset(usuarios_clientes, request)
        serializer_data = [
            {
                "usuario": usuario.usuario,
                "cedula": usuario.cedula,
                "nombre": usuario.nombre,
                "telefono": usuario.telefono,
                "correo": usuario.correo,
            }
            for usuario in result_page
        ]

        return paginator.get_paginated_response(serializer_data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def get_birthdate_from_age(age):
    current_year = date.today().year
    birth_year = current_year - age
    return date(birth_year, 1, 1)

@api_view(['GET'])
def consult_mascotas(request):
    search = request.GET.get('search', '')  # Puede ser el nombre, raza, etc.
    column = request.GET.get('column', 'nombre')  # Default: buscar por nombre
    order = request.GET.get('order', 'asc')

    try:
        mascotas = Mascotas.objects.all()

        # Aplicar filtros de búsqueda si es necesario
        if search:
            if column == 'fecha_nacimiento':
                birthdate = get_birthdate_from_age(int(search))
                mascotas = mascotas.filter(fecha_nacimiento__year=birthdate.year)
            elif column == 'usuario_cliente':
                search_filter = {'usuario_cliente__usuario__icontains': search}
                mascotas = mascotas.filter(**search_filter)
            else:
                search_filter = {f'{column}__icontains': search}
                mascotas = mascotas.filter(**search_filter)

        if order == 'desc':
            mascotas = mascotas.order_by(f'-{column}')
        else:
            mascotas = mascotas.order_by(column)

        paginator = CustomPagination()
        result_page = paginator.paginate_queryset(mascotas, request)
        serializer = MascotaSerializer(result_page, many=True)

        return paginator.get_paginated_response(serializer.data)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


