 Guía de Uso: @sweetalert2/ngx-sweetalert2Esta guía detalla cómo integrar de forma profesional SweetAlert2 en aplicaciones Angular.📌 Configuración Inicial[!IMPORTANT]Regla de oro: Siempre actualiza sweetalert2 al mismo tiempo que ngx-sweetalert2, ya que las definiciones de tipos están vinculadas estáticamente.1. Registro de ProvidersConfigura la librería en tu app.config.ts o main.ts para habilitar las funcionalidades globales.TypeScript// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideSweetAlert2 } from '@sweetalert2/ngx-sweetalert2';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSweetAlert2({
      fireOnInit: false,
      dismissOnDestroy: true,
    }),
  ],
};
2. Importación en ComponentesImporta los elementos necesarios directamente en el array imports de tu componente Standalone.TypeScriptimport { Component } from '@angular/core';
import { SwalComponent, SwalDirective } from '@sweetalert2/ngx-sweetalert2';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [SwalComponent, SwalDirective],
  templateUrl: './my-component.html'
})
export class MyComponent {}
🛠️ API de Directivas y Componentes1. SwalDirective ([swal])Ideal para disparar alertas rápidas al hacer clic en un elemento.Uso simple (Array): [title, text, icon]Uso avanzado (Objeto): Pasa un objeto SweetAlertOptions.HTML<button [swal]="['¡Hecho!', 'El archivo se guardó.', 'success']">
  Guardar
</button>

<button
  [swal]="{ 
    title: '¿Guardar cambios?', 
    showDenyButton: true, 
    denyButtonText: 'No guardar',
    showCancelButton: true 
  }"
  (confirm)="saveFile($event)"
  (deny)="handleDenial()"
  (dismiss)="handleDismiss($event)">
  Opciones Avanzadas
</button>
2. SwalComponent (<swal>)Úsalo cuando la configuración sea demasiado extensa para una directiva o necesites control total desde el código.HTML<swal
  #deleteSwal
  title="¿Eliminar {{ file.name }}?"
  text="Esta acción no se puede deshacer"
  icon="warning"
  [showCancelButton]="true"
  (confirm)="deleteFile(file)">
</swal>

<button [swal]="deleteSwal">Eliminar</button>

<button (click)="deleteSwal.fire()">Eliminar manual</button>
Acceso desde TypeScript:TypeScript@ViewChild('deleteSwal') public readonly deleteSwal!: SwalComponent;

// Luego puedes usar: this.deleteSwal.fire();
⚡ Ciclo de Vida y EventosPuedes suscribirte a todos los eventos nativos de SweetAlert2 directamente en el componente:EventoDescripción(willOpen)Antes de que la alerta se abra.(didOpen)Cuando la alerta ya es visible.(didRender)Al renderizarse el DOM de la alerta.(willClose)Antes de cerrar la alerta.(didClose)Al cerrarse completamente.🖼️ SwalPortal (Contenido Dinámico)La directiva *swalPortal permite inyectar templates de Angular (con binding y directivas) dentro de las zonas de la alerta.Configuración de Objetivos (Targets)Para usar targets específicos, inyecta SwalPortalTargets en tu constructor:TypeScriptimport { SwalPortalTargets } from '@sweetalert2/ngx-sweetalert2';

constructor(public readonly swalTargets: SwalPortalTargets) {}
Ejemplo de Uso Multizona:Puedes reemplazar el contenido principal, el título, los botones o el pie de página.HTML<swal title="Formulario Dinámico" (confirm)="sendForm(myForm.value)">
  
  <form *swalPortal [formGroup]="myForm">
    <input formControlName="email" placeholder="Email">
  </form>

  <ng-container *swalPortal="swalTargets.confirmButton">
    Enviar a {{ myForm.value.email }}
  </ng-container>

  <div *swalPortal="swalTargets.footer">
    Segundos transcurridos: {{ timer }}
  </div>

</swal>
Targets disponibles: title, content, actions, confirmButton, cancelButton, denyButton, closeButton, footer.