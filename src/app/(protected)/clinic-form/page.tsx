import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ClinicForm from "./components/form";

const ClinicFormPage = () => {
  return (
    <Dialog open={true}>
      <form>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar uma clinica</DialogTitle>
            <DialogDescription>
              Adicionar uma clinica para continuar.
            </DialogDescription>
          </DialogHeader>
          <ClinicForm />
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default ClinicFormPage;
