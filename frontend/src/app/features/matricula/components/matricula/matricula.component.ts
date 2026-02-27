import { Component, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type MatriculaTab = 'dados' | 'responsaveis';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

@Component({
  selector: 'app-matricula',
  templateUrl: './matricula.component.html',
  styleUrls: ['./matricula.component.scss']
})
export class MatriculaComponent implements AfterViewInit {
  activeTab: MatriculaTab = 'dados';
  useSameAddress = false;

  cepLoadingAluno = false;
  cepErroAluno = false;
  cepLoadingResp = false;
  cepErroResp = false;

  alunoEndereco = {
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', uf: '', cidade: ''
  };

  respEndereco = {
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', uf: '', cidade: ''
  };

  constructor(private http: HttpClient) {}

  buscarCepAluno(): void {
    const cep = this.alunoEndereco.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    this.cepLoadingAluno = true;
    this.cepErroAluno = false;
    this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (data) => {
        this.cepLoadingAluno = false;
        if (data.erro) { this.cepErroAluno = true; return; }
        this.alunoEndereco.logradouro = data.logradouro;
        this.alunoEndereco.bairro     = data.bairro;
        this.alunoEndereco.uf         = data.uf;
        this.alunoEndereco.cidade     = data.localidade;
        if (!this.alunoEndereco.complemento) this.alunoEndereco.complemento = data.complemento;
      },
      error: () => { this.cepLoadingAluno = false; this.cepErroAluno = true; }
    });
  }

  buscarCepResp(): void {
    const cep = this.respEndereco.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    this.cepLoadingResp = true;
    this.cepErroResp = false;
    this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (data) => {
        this.cepLoadingResp = false;
        if (data.erro) { this.cepErroResp = true; return; }
        this.respEndereco.logradouro = data.logradouro;
        this.respEndereco.bairro     = data.bairro;
        this.respEndereco.uf         = data.uf;
        this.respEndereco.cidade     = data.localidade;
        if (!this.respEndereco.complemento) this.respEndereco.complemento = data.complemento;
      },
      error: () => { this.cepLoadingResp = false; this.cepErroResp = true; }
    });
  }

  toggleSameAddress(): void {
    if (this.useSameAddress) {
      this.respEndereco = { ...this.alunoEndereco };
      this.cepErroResp = false;
      this.cepLoadingResp = false;
    } else {
      this.respEndereco = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', uf: '', cidade: '' };
    }
  }

  setTab(tab: MatriculaTab): void {
    this.activeTab = tab;
    this.runFrameLoop(500);
  }

  nextTab(): void {
    this.activeTab = 'responsaveis';
    this.runFrameLoop(500);
  }

  prevTab(): void {
    this.activeTab = 'dados';
    this.runFrameLoop(500);
  }

  ngAfterViewInit(): void {
    this.runFrameLoop(1200);

    // Observa mudancas no DOM e reaplica por 5s (UserWay costuma injetar estilos)
    const observer = new MutationObserver(() => {
      this.forceMatriculaStyles();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    setTimeout(() => {
      observer.disconnect();
    }, 5000);
  }

  private runFrameLoop(durationMs: number): void {
    const startTime = performance.now();
    const frameLoop = () => {
      this.forceMatriculaStyles();
      if (performance.now() - startTime < durationMs) {
        requestAnimationFrame(frameLoop);
      }
    };
    requestAnimationFrame(frameLoop);
  }

  private forceMatriculaStyles(): void {
    const page = document.querySelector('.matricula-page') as HTMLElement;
    if (page) {
      page.style.setProperty('text-align', 'left', 'important');
      page.style.setProperty('width', '100%', 'important');
      page.style.setProperty('margin', '0', 'important');
      page.style.setProperty('display', 'block', 'important');
    }

    const header = document.querySelector('.page-header') as HTMLElement;
    const h1 = document.querySelector('.page-header h1') as HTMLElement;
    if (h1) {
      h1.style.setProperty('text-align', 'left', 'important');
    }
    if (header) {
      header.style.setProperty('display', 'flex', 'important');
      header.style.setProperty('justify-content', 'space-between', 'important');
      header.style.setProperty('align-items', 'center', 'important');
      header.style.setProperty('text-align', 'left', 'important');
    }

    const tabs = document.querySelector('.tabs') as HTMLElement;
    if (tabs) {
      tabs.style.setProperty('display', 'flex', 'important');
      tabs.style.setProperty('justify-content', 'flex-start', 'important');
      tabs.style.setProperty('text-align', 'left', 'important');
    }

    const form = document.querySelector('.form') as HTMLElement;
    if (form) {
      form.style.setProperty('text-align', 'left', 'important');
      form.style.setProperty('width', '100%', 'important');
    }

    const grids = document.querySelectorAll('.field-grid') as NodeListOf<HTMLElement>;
    grids.forEach(grid => {
      grid.style.setProperty('display', 'grid', 'important');
      grid.style.setProperty('justify-items', 'stretch', 'important');
      grid.style.setProperty('text-align', 'left', 'important');
      grid.style.setProperty('width', '100%', 'important');
    });

    const fields = document.querySelectorAll('.field') as NodeListOf<HTMLElement>;
    fields.forEach(field => {
      field.style.setProperty('display', 'flex', 'important');
      field.style.setProperty('flex-direction', 'column', 'important');
      field.style.setProperty('align-items', 'stretch', 'important');
      field.style.setProperty('text-align', 'left', 'important');
      field.style.setProperty('width', '100%', 'important');

      const spans = field.querySelectorAll('span') as NodeListOf<HTMLElement>;
      spans.forEach(span => {
        span.style.setProperty('text-align', 'left', 'important');
        span.style.setProperty('display', 'block', 'important');
        span.style.setProperty('width', '100%', 'important');
      });

      const inputs = field.querySelectorAll('input, select') as NodeListOf<HTMLElement>;
      inputs.forEach(input => {
        input.style.setProperty('width', '100%', 'important');
        input.style.setProperty('text-align', 'left', 'important');
        input.style.setProperty('text-align-last', 'left', 'important');
        input.style.setProperty('display', 'block', 'important');
        input.style.setProperty('box-sizing', 'border-box', 'important');
      });
    });

    const fieldGroups = document.querySelectorAll('.field-group') as NodeListOf<HTMLElement>;
    fieldGroups.forEach(group => {
      group.style.setProperty('display', 'flex', 'important');
      group.style.setProperty('flex-direction', 'column', 'important');
      group.style.setProperty('align-items', 'stretch', 'important');
    });

    const sameAddressCheck = document.querySelector('.same-address-check') as HTMLElement;
    if (sameAddressCheck) {
      sameAddressCheck.style.setProperty('display', 'flex', 'important');
      sameAddressCheck.style.setProperty('flex-direction', 'row', 'important');
      sameAddressCheck.style.setProperty('align-items', 'center', 'important');
      sameAddressCheck.style.setProperty('justify-content', 'flex-start', 'important');
      sameAddressCheck.style.setProperty('width', '100%', 'important');
      sameAddressCheck.style.setProperty('position', 'relative', 'important');
      sameAddressCheck.style.setProperty('margin-left', '0', 'important');
    }

    const groupTitles = document.querySelectorAll('.group-title') as NodeListOf<HTMLElement>;
    groupTitles.forEach(title => {
      title.style.setProperty('text-align', 'left', 'important');
      title.style.setProperty('display', 'block', 'important');
      title.style.setProperty('width', '100%', 'important');
    });

    const formActions = document.querySelector('.form-actions') as HTMLElement;
    if (formActions) {
      formActions.style.setProperty('display', 'flex', 'important');
      formActions.style.setProperty('justify-content', 'space-between', 'important');
      formActions.style.setProperty('align-items', 'center', 'important');
      formActions.style.setProperty('text-align', 'left', 'important');
    }

    const submitBtn = document.querySelector('.form-actions .primary') as HTMLElement;
    if (submitBtn) {
      submitBtn.style.setProperty('margin-left', 'auto', 'important');
    }
  }
}
