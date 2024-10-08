import React from 'react';
import { useNavigate } from "react-router-dom";

function Error() {
    const navigate = useNavigate();

    return (
        <>
            <div className="flex flex-col h-screen w-screen bg-[url('./src/assets/shapes/wave.svg')] bg-no-repeat bg-bottom justify-center items-center text-secondary pb-52">
                <div className="text-center p-14">

                    <h1 className="font-bold text-6xl">Error 404</h1>
                    <h2 className="text-3xl pt-10">
                        La página que buscas no puede cargarse ahora
                        <br />
                        o no tienes los permisos necesarios.
                    </h2>
                    <p className="text-3xl p-10">Revisa la URL o contacta con el administrador</p>
                    <a href="/" className="text-2xl underline">Volver a la página de inicio</a>
                </div>
            </div>
        </>
    );
};

export default Error;
